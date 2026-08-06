package com.rehman.finance.finance.service.impl;

import com.rehman.finance.exception.BusinessException;
import com.rehman.finance.exception.ErrorCode;
import com.rehman.finance.finance.dto.response.LoanHistoryResponse;
import com.rehman.finance.finance.entity.*;
import com.rehman.finance.finance.repository.*;
import com.rehman.finance.finance.service.LoanHistoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class LoanHistoryServiceImpl implements LoanHistoryService {

    private final LoanUserRepository loanUserRepository;
    private final LoanHistoryRepository loanHistoryRepository;
    private final WalletRepository walletRepository;
    private final LedgerEntryRepository ledgerEntryRepository;

    @Override
    @Transactional
    public void processLoanTransaction(Long userId, TransactionHistory history, TransactionDetails details, String subcategoryCode) {
        String personName = history.getPersonName();
        if (personName == null || personName.isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Person name is required for loan transactions");
        }

        List<LoanUser> existingUsers = loanUserRepository.findByUserIdAndFullName(userId, personName.trim());
        if (existingUsers.isEmpty()) {
            throw new BusinessException(ErrorCode.LOAN_USER_NOT_FOUND,
                    "Loan user not found: \"" + personName.trim()
                            + "\". Create the loan user before recording the loan transaction.");
        }
        LoanUser loanUser = existingUsers.get(0);

        BigDecimal transactionAmount = details.getAmount();
        BigDecimal currentAmount = loanUser.getCurrentAmount();
        String currentStatus = loanUser.getLoanStatus();

        BigDecimal signedAmount = "PAYABLE".equals(currentStatus) ? currentAmount.negate() : currentAmount;
        BigDecimal newSignedAmount = "RECEIVABLE".equals(subcategoryCode)
                ? signedAmount.add(transactionAmount)
                : signedAmount.subtract(transactionAmount);

        BigDecimal newAmount;
        String newStatus;

        if (newSignedAmount.compareTo(BigDecimal.ZERO) > 0) {
            newAmount = newSignedAmount;
            newStatus = "RECEIVABLE";
        } else if (newSignedAmount.compareTo(BigDecimal.ZERO) < 0) {
            newAmount = newSignedAmount.negate();
            newStatus = "PAYABLE";
        } else {
            newAmount = BigDecimal.ZERO;
            newStatus = "CLOSED";
        }

        loanUser.setCurrentAmount(newAmount);
        loanUser.setLoanStatus(newStatus);
        loanUserRepository.save(loanUser);

        String previousStatus = currentStatus != null ? currentStatus : "CLOSED";

        LoanHistory loanHistory = LoanHistory.builder()
                .loanUser(loanUser)
                .transactionHistory(history)
                .transactionDetail(details)
                .amount(transactionAmount)
                .previousAmount(currentAmount)
                .currentAmount(newAmount)
                .previousStatus(previousStatus)
                .currentStatus(newStatus)
                .transactionType(subcategoryCode)
                .remarks(history.getDescription())
                .build();
        loanHistoryRepository.save(loanHistory);

        Wallet ledgerWallet = details.getWallet() != null ? details.getWallet() : details.getSourceWallet();
        LedgerEntry ledgerEntry = LedgerEntry.builder()
                .transactionDetails(details)
                .userId(userId)
                .wallet(ledgerWallet)
                .debit("RECEIVABLE".equals(subcategoryCode) ? transactionAmount : BigDecimal.ZERO)
                .credit("PAYABLE".equals(subcategoryCode) ? transactionAmount : BigDecimal.ZERO)
                .balanceAfter(ledgerWallet != null ? ledgerWallet.getCurrentBalance() : BigDecimal.ZERO)
                .remarks("Loan " + subcategoryCode + ": " + personName + " - " + history.getDescription())
                .build();
        ledgerEntryRepository.save(ledgerEntry);

        log.info("Loan processed: userId={}, person={}, subcategory={}, amount={}, newAmount={}, newStatus={}",
                userId, personName, subcategoryCode, transactionAmount, newAmount, newStatus);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LoanHistoryResponse> getLoanHistoryByUser(Long userId, Long loanUserId) {
        LoanUser loanUser = loanUserRepository.findById(loanUserId)
                .orElseThrow(() -> new BusinessException(ErrorCode.LOAN_USER_NOT_FOUND));

        if (!loanUser.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }

        return loanHistoryRepository.findByLoanUserIdOrderByCreatedAtDesc(loanUserId).stream()
                .map(this::toResponse)
                .toList();
    }

    private LoanHistoryResponse toResponse(LoanHistory history) {
        return LoanHistoryResponse.builder()
                .id(history.getId())
                .loanUserId(history.getLoanUser().getId())
                .transactionHistoryId(history.getTransactionHistory() != null ? history.getTransactionHistory().getId() : null)
                .transactionDetailId(history.getTransactionDetail() != null ? history.getTransactionDetail().getId() : null)
                .amount(history.getAmount())
                .previousAmount(history.getPreviousAmount())
                .currentAmount(history.getCurrentAmount())
                .previousStatus(history.getPreviousStatus())
                .currentStatus(history.getCurrentStatus())
                .transactionType(history.getTransactionType())
                .remarks(history.getRemarks())
                .createdAt(history.getCreatedAt())
                .build();
    }
}
