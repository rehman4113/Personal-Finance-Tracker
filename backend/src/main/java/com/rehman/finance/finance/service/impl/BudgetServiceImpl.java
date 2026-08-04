package com.rehman.finance.finance.service.impl;

import com.rehman.finance.exception.BusinessException;
import com.rehman.finance.exception.ErrorCode;
import com.rehman.finance.finance.dto.request.BudgetRequest;
import com.rehman.finance.finance.dto.response.BudgetResponse;
import com.rehman.finance.finance.entity.BudgetLimit;
import com.rehman.finance.finance.entity.TransactionDetails;
import com.rehman.finance.finance.entity.TransactionPurpose;
import com.rehman.finance.finance.repository.BudgetLimitRepository;
import com.rehman.finance.finance.repository.TransactionDetailsRepository;
import com.rehman.finance.finance.repository.TransactionPurposeRepository;
import com.rehman.finance.finance.service.BudgetService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class BudgetServiceImpl implements BudgetService {

    private final BudgetLimitRepository budgetLimitRepository;
    private final TransactionPurposeRepository transactionPurposeRepository;
    private final TransactionDetailsRepository transactionDetailsRepository;

    @Override
    @Transactional
    public BudgetResponse createBudget(Long userId, BudgetRequest request) {
        TransactionPurpose purpose = transactionPurposeRepository.findById(request.getTransactionPurposeId())
                .orElseThrow(() -> new BusinessException(ErrorCode.TRANSACTION_PURPOSE_NOT_FOUND));

        budgetLimitRepository.findByUserIdAndTransactionPurposeIdAndMonth(userId, request.getTransactionPurposeId(), request.getMonth())
                .ifPresent(b -> {
                    throw new BusinessException(ErrorCode.DUPLICATE_BUDGET);
                });

        BudgetLimit budget = BudgetLimit.builder()
                .userId(userId)
                .transactionPurpose(purpose)
                .monthlyLimit(request.getMonthlyLimit())
                .month(request.getMonth())
                .warningThreshold(request.getWarningThreshold() != null ? request.getWarningThreshold() : 80)
                .build();

        budget = budgetLimitRepository.save(budget);
        log.info("Budget created: id={}, userId={}, month={}", budget.getId(), userId, request.getMonth());
        return toResponse(budget, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public BudgetResponse getBudget(Long userId, Long budgetId) {
        BudgetLimit budget = budgetLimitRepository.findById(budgetId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BUDGET_NOT_FOUND));

        if (!budget.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }
        return toResponse(budget, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BudgetResponse> getUserBudgetsForMonth(Long userId, String month) {
        return budgetLimitRepository.findByUserIdAndMonth(userId, month).stream()
                .map(budget -> toResponse(budget, userId))
                .toList();
    }

    @Override
    @Transactional
    public BudgetResponse updateBudget(Long userId, Long budgetId, BudgetRequest request) {
        BudgetLimit budget = budgetLimitRepository.findById(budgetId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BUDGET_NOT_FOUND));

        if (!budget.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }

        TransactionPurpose purpose = transactionPurposeRepository.findById(request.getTransactionPurposeId())
                .orElseThrow(() -> new BusinessException(ErrorCode.TRANSACTION_PURPOSE_NOT_FOUND));

        budgetLimitRepository.findByUserIdAndTransactionPurposeIdAndMonthAndIdNot(
                userId, request.getTransactionPurposeId(), request.getMonth(), budgetId)
                .ifPresent(b -> {
                    throw new BusinessException(ErrorCode.DUPLICATE_BUDGET);
                });

        budget.setTransactionPurpose(purpose);
        budget.setMonthlyLimit(request.getMonthlyLimit());
        budget.setMonth(request.getMonth());
        if (request.getWarningThreshold() != null) {
            budget.setWarningThreshold(request.getWarningThreshold());
        }

        budget = budgetLimitRepository.save(budget);
        log.info("Budget updated: id={}", budget.getId());
        return toResponse(budget, userId);
    }

    @Override
    @Transactional
    public void deleteBudget(Long userId, Long budgetId) {
        BudgetLimit budget = budgetLimitRepository.findById(budgetId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BUDGET_NOT_FOUND));

        if (!budget.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }
        budgetLimitRepository.delete(budget);
        log.info("Budget deleted: id={}", budgetId);
    }

    private BudgetResponse toResponse(BudgetLimit budget, Long userId) {
        BigDecimal totalSpent = calculateTotalSpent(userId, budget.getTransactionPurpose().getId(), budget.getMonth());
        BigDecimal remaining = budget.getMonthlyLimit().subtract(totalSpent);
        if (remaining.compareTo(BigDecimal.ZERO) < 0) {
            remaining = BigDecimal.ZERO;
        }
        int usagePercentage = budget.getMonthlyLimit().compareTo(BigDecimal.ZERO) > 0
                ? totalSpent.multiply(BigDecimal.valueOf(100))
                .divide(budget.getMonthlyLimit(), 0, RoundingMode.HALF_UP)
                .intValue()
                : 0;

        String alertLevel = "NORMAL";
        if (usagePercentage >= 100) {
            alertLevel = "EXCEEDED";
        } else if (usagePercentage >= budget.getWarningThreshold()) {
            alertLevel = "WARNING";
        }

        return BudgetResponse.builder()
                .id(budget.getId())
                .userId(budget.getUserId())
                .purposeCode(budget.getTransactionPurpose().getCode())
                .purposeName(budget.getTransactionPurpose().getName())
                .monthlyLimit(budget.getMonthlyLimit())
                .month(budget.getMonth())
                .warningThreshold(budget.getWarningThreshold())
                .totalSpent(totalSpent)
                .remaining(remaining)
                .usagePercentage(usagePercentage)
                .alertLevel(alertLevel)
                .createdAt(budget.getCreatedAt())
                .build();
    }

    private BigDecimal calculateTotalSpent(Long userId, Long purposeId, String month) {
        List<TransactionDetails> detailsList = transactionDetailsRepository.findByUserId(userId);
        return detailsList.stream()
                .filter(t -> t.getTransactionHistory().getTransactionPurpose().getId().equals(purposeId))
                .filter(t -> {
                    String transactionMonth = t.getTransactionHistory().getTransactionDate().toLocalDate().toString().substring(0, 7);
                    return transactionMonth.equals(month);
                })
                .filter(t -> "EXPENSE".equals(t.getTransactionHistory().getTransactionType().getCode()))
                .map(TransactionDetails::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

}
