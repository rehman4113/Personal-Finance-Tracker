package com.rehman.finance.finance.service.impl;

import com.rehman.finance.exception.BusinessException;
import com.rehman.finance.exception.ErrorCode;
import com.rehman.finance.finance.dto.request.TransactionRequest;
import com.rehman.finance.finance.dto.response.TransactionDetailResponse;
import com.rehman.finance.finance.entity.LedgerEntry;
import com.rehman.finance.finance.entity.TransactionDetails;
import com.rehman.finance.finance.entity.TransactionHistory;
import com.rehman.finance.finance.entity.Wallet;
import com.rehman.finance.finance.repository.LedgerEntryRepository;
import com.rehman.finance.finance.repository.TransactionDetailsRepository;
import com.rehman.finance.finance.repository.WalletRepository;
import com.rehman.finance.finance.service.TransactionDetailsService;
import com.rehman.finance.response.PageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TransactionDetailsServiceImpl implements TransactionDetailsService {

    private final TransactionDetailsRepository transactionDetailsRepository;
    private final WalletRepository walletRepository;
    private final LedgerEntryRepository ledgerEntryRepository;

    @Override
    @Transactional
    public List<TransactionDetails> createTransactionDetails(Long userId, TransactionHistory history, String typeCode, List<TransactionRequest.WalletEntry> entries) {
        List<TransactionDetails> detailsList = new ArrayList<>();
        for (TransactionRequest.WalletEntry entry : entries) {
            TransactionDetails.TransactionDetailsBuilder builder = TransactionDetails.builder()
                    .transactionHistory(history)
                    .userId(userId)
                    .amount(entry.getAmount())
                    .merchant(entry.getMerchant());

            if ("INCOME".equals(typeCode) || "EXPENSE".equals(typeCode) || "LOAN".equals(typeCode)) {
                Wallet wallet = walletRepository.findByIdForUpdate(entry.getWalletId())
                        .orElseThrow(() -> new BusinessException(ErrorCode.WALLET_NOT_FOUND));
                builder.wallet(wallet);
            }
            if ("TRANSFER".equals(typeCode)) {
                Wallet source = walletRepository.findByIdForUpdate(entry.getSourceWalletId())
                        .orElseThrow(() -> new BusinessException(ErrorCode.WALLET_NOT_FOUND));
                Wallet destination = walletRepository.findByIdForUpdate(entry.getDestinationWalletId())
                        .orElseThrow(() -> new BusinessException(ErrorCode.WALLET_NOT_FOUND));
                builder.sourceWallet(source).destinationWallet(destination);
            }

            TransactionDetails details = builder.build();
            details = transactionDetailsRepository.save(details);
            detailsList.add(details);

            String subcategoryCode = history.getTransactionSubcategory() != null ? history.getTransactionSubcategory().getCode() : null;
            updateWalletBalance(details, typeCode, subcategoryCode);
            writeLedgerEntries(details, userId, typeCode, subcategoryCode);
        }
        return detailsList;
    }

    @Override
    @Transactional(readOnly = true)
    public TransactionDetailResponse getTransactionDetailsById(Long userId, Long id) {
        TransactionDetails details = transactionDetailsRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.TRANSACTION_NOT_FOUND, "Transaction detail not found"));

        if (!details.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }
        return toResponse(details);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<TransactionDetailResponse> getTransactionDetailsByUserId(Long userId, int page, int size) {
        int safeSize = Math.min(Math.max(size, 1), PageResponse.MAX_PAGE_SIZE);
        int safePage = Math.max(page, 0);
        Page<TransactionDetails> detailsPage = transactionDetailsRepository.findByUserId(userId, PageRequest.of(safePage, safeSize));
        return PageResponse.from(detailsPage, this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TransactionDetailResponse> getTransactionDetailsByUserIdAndHistoryId(Long userId, Long transactionHistoryId) {
        return transactionDetailsRepository.findByUserIdAndTransactionHistoryId(userId, transactionHistoryId).stream()
                .map(this::toResponse)
                .toList();
    }

    private void updateWalletBalance(TransactionDetails details, String typeCode, String subcategoryCode) {
        switch (typeCode) {
            case "INCOME" -> {
                Wallet wallet = details.getWallet();
                wallet.setCurrentBalance(wallet.getCurrentBalance().add(details.getAmount()));
                walletRepository.save(wallet);
            }
            case "EXPENSE" -> {
                Wallet wallet = details.getWallet();
                wallet.setCurrentBalance(wallet.getCurrentBalance().subtract(details.getAmount()));
                walletRepository.save(wallet);
            }
            case "LOAN" -> {
                Wallet wallet = details.getWallet();
                if ("RECEIVABLE".equals(subcategoryCode)) {
                    wallet.setCurrentBalance(wallet.getCurrentBalance().subtract(details.getAmount()));
                } else {
                    wallet.setCurrentBalance(wallet.getCurrentBalance().add(details.getAmount()));
                }
                walletRepository.save(wallet);
            }
            case "TRANSFER" -> {
                Wallet source = details.getSourceWallet();
                Wallet destination = details.getDestinationWallet();
                source.setCurrentBalance(source.getCurrentBalance().subtract(details.getAmount()));
                destination.setCurrentBalance(destination.getCurrentBalance().add(details.getAmount()));
                walletRepository.save(source);
                walletRepository.save(destination);
            }
        }
    }

    private void writeLedgerEntries(TransactionDetails details, Long userId, String typeCode, String subcategoryCode) {
        BigDecimal amount = details.getAmount();
        String remarks = buildLedgerRemarks(details, typeCode, subcategoryCode);

        switch (typeCode) {
            case "INCOME" -> saveLedgerEntry(details, userId, details.getWallet(), BigDecimal.ZERO, amount, remarks);
            case "EXPENSE" -> saveLedgerEntry(details, userId, details.getWallet(), amount, BigDecimal.ZERO, remarks);
            case "TRANSFER" -> {
                saveLedgerEntry(details, userId, details.getSourceWallet(), amount, BigDecimal.ZERO, remarks);
                saveLedgerEntry(details, userId, details.getDestinationWallet(), BigDecimal.ZERO, amount, remarks);
            }
        }
    }

    private void saveLedgerEntry(TransactionDetails details, Long userId, Wallet wallet, BigDecimal debit, BigDecimal credit, String remarks) {
        LedgerEntry entry = LedgerEntry.builder()
                .transactionDetails(details)
                .userId(userId)
                .wallet(wallet)
                .debit(debit)
                .credit(credit)
                .balanceAfter(wallet.getCurrentBalance())
                .remarks(remarks)
                .build();
        ledgerEntryRepository.save(entry);
    }

    private String buildLedgerRemarks(TransactionDetails details, String typeCode, String subcategoryCode) {
        if ("LOAN".equals(typeCode)) {
            return "Loan " + (subcategoryCode != null ? subcategoryCode : "") + (details.getMerchant() != null ? " - " + details.getMerchant() : "");
        }
        if ("TRANSFER".equals(typeCode)) {
            return "Transfer between wallets";
        }
        return (typeCode != null ? typeCode : "") + (details.getMerchant() != null ? " - " + details.getMerchant() : "");
    }

    private TransactionDetailResponse toResponse(TransactionDetails details) {
        Wallet wallet = details.getWallet();
        Wallet source = details.getSourceWallet();
        Wallet destination = details.getDestinationWallet();
        return TransactionDetailResponse.builder()
                .id(details.getId())
                .transactionHistoryId(details.getTransactionHistory().getId())
                .userId(details.getUserId())
                .walletId(wallet != null ? wallet.getId() : null)
                .walletName(wallet != null ? wallet.getWalletName() : null)
                .walletTypeCode(wallet != null ? wallet.getWalletType().getCode() : null)
                .walletTypeName(wallet != null ? wallet.getWalletType().getName() : null)
                .currency(wallet != null ? wallet.getCurrency() : null)
                .sourceWalletId(source != null ? source.getId() : null)
                .sourceWalletName(source != null ? source.getWalletName() : null)
                .destinationWalletId(destination != null ? destination.getId() : null)
                .destinationWalletName(destination != null ? destination.getWalletName() : null)
                .amount(details.getAmount())
                .merchant(details.getMerchant())
                .createdAt(details.getCreatedAt())
                .build();
    }
}
