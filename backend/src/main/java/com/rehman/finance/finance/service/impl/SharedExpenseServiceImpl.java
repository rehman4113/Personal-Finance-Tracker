package com.rehman.finance.finance.service.impl;

import com.rehman.finance.exception.BusinessException;
import com.rehman.finance.exception.ErrorCode;
import com.rehman.finance.finance.dto.request.MemberShareRequest;
import com.rehman.finance.finance.dto.request.SharedExpenseRequest;
import com.rehman.finance.finance.dto.response.MemberShareResponse;
import com.rehman.finance.finance.dto.response.SharedExpenseResponse;
import com.rehman.finance.finance.entity.SharedExpense;
import com.rehman.finance.finance.entity.SharedExpenseMember;
import com.rehman.finance.finance.repository.SharedExpenseMemberRepository;
import com.rehman.finance.finance.repository.SharedExpenseRepository;
import com.rehman.finance.finance.service.SharedExpenseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SharedExpenseServiceImpl implements SharedExpenseService {

    private final SharedExpenseRepository sharedExpenseRepository;
    private final SharedExpenseMemberRepository sharedExpenseMemberRepository;

    @Override
    @Transactional
    public SharedExpenseResponse createSharedExpense(Long userId, SharedExpenseRequest request) {
        SharedExpense expense = SharedExpense.builder()
                .userId(userId)
                .totalAmount(request.getTotalAmount())
                .description(request.getDescription())
                .splitType(request.getSplitType())
                .numMembers(request.getNumMembers())
                .expenseDate(request.getExpenseDate())
                .build();

        expense = sharedExpenseRepository.save(expense);

        List<SharedExpenseMember> members = new ArrayList<>();

        if ("EQUAL".equalsIgnoreCase(request.getSplitType()) && request.getNumMembers() != null) {
            BigDecimal perPerson = request.getTotalAmount()
                    .divide(BigDecimal.valueOf(request.getNumMembers()), 2, RoundingMode.HALF_UP);
            for (int i = 1; i <= request.getNumMembers(); i++) {
                SharedExpenseMember member = SharedExpenseMember.builder()
                        .sharedExpense(expense)
                        .memberName("Member " + i)
                        .shareAmount(perPerson)
                        .settled(false)
                        .build();
                members.add(sharedExpenseMemberRepository.save(member));
            }
        } else if ("MANUAL".equalsIgnoreCase(request.getSplitType()) && request.getMembers() != null) {
            for (MemberShareRequest m : request.getMembers()) {
                SharedExpenseMember member = SharedExpenseMember.builder()
                        .sharedExpense(expense)
                        .memberName(m.getMemberName())
                        .shareAmount(m.getShareAmount())
                        .settled(false)
                        .build();
                members.add(sharedExpenseMemberRepository.save(member));
            }
            expense.setNumMembers(request.getMembers().size());
            sharedExpenseRepository.save(expense);
        }

        log.info("Shared expense created: id={}, userId={}", expense.getId(), userId);
        return toResponse(expense, members);
    }

    @Override
    @Transactional(readOnly = true)
    public SharedExpenseResponse getSharedExpense(Long userId, Long expenseId) {
        SharedExpense expense = sharedExpenseRepository.findById(expenseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SHARED_EXPENSE_NOT_FOUND));

        if (!expense.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }

        List<SharedExpenseMember> members = sharedExpenseMemberRepository.findBySharedExpenseId(expenseId);
        return toResponse(expense, members);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SharedExpenseResponse> getUserSharedExpenses(Long userId) {
        return sharedExpenseRepository.findByUserId(userId).stream()
                .map(expense -> {
                    List<SharedExpenseMember> members = sharedExpenseMemberRepository.findBySharedExpenseId(expense.getId());
                    return toResponse(expense, members);
                })
                .toList();
    }

    @Override
    @Transactional
    public void settleMember(Long userId, Long expenseId, Long memberId) {
        SharedExpense expense = sharedExpenseRepository.findById(expenseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SHARED_EXPENSE_NOT_FOUND));

        if (!expense.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }

        SharedExpenseMember member = sharedExpenseMemberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        if (!member.getSharedExpense().getId().equals(expenseId)) {
            throw new BusinessException(ErrorCode.INVALID_TRANSACTION, "Member does not belong to this expense");
        }

        member.setSettled(true);
        member.setSettledDate(LocalDateTime.now());
        sharedExpenseMemberRepository.save(member);
        log.info("Member settled: expenseId={}, memberId={}", expenseId, memberId);
    }

    private SharedExpenseResponse toResponse(SharedExpense expense, List<SharedExpenseMember> members) {
        List<MemberShareResponse> memberResponses = members.stream()
                .map(m -> MemberShareResponse.builder()
                        .id(m.getId())
                        .memberName(m.getMemberName())
                        .shareAmount(m.getShareAmount())
                        .settled(m.getSettled())
                        .settledDate(m.getSettledDate())
                        .createdAt(m.getCreatedAt())
                        .build())
                .toList();

        return SharedExpenseResponse.builder()
                .id(expense.getId())
                .userId(expense.getUserId())
                .totalAmount(expense.getTotalAmount())
                .description(expense.getDescription())
                .splitType(expense.getSplitType())
                .numMembers(expense.getNumMembers())
                .expenseDate(expense.getExpenseDate())
                .members(memberResponses)
                .createdAt(expense.getCreatedAt())
                .build();
    }

}
