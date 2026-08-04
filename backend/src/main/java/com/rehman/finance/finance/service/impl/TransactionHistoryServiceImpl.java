package com.rehman.finance.finance.service.impl;

import com.rehman.finance.exception.BusinessException;
import com.rehman.finance.exception.ErrorCode;
import com.rehman.finance.finance.dto.request.TransactionRequest;
import com.rehman.finance.finance.dto.response.LedgerEntryResponse;
import com.rehman.finance.finance.dto.response.TransactionResponse;
import com.rehman.finance.finance.entity.*;
import com.rehman.finance.finance.repository.*;
import com.rehman.finance.finance.service.LoanHistoryService;
import com.rehman.finance.finance.service.TransactionDetailsService;
import com.rehman.finance.finance.service.TransactionHistoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TransactionHistoryServiceImpl implements TransactionHistoryService {

    private final TransactionHistoryRepository transactionHistoryRepository;
    private final TransactionDetailsRepository transactionDetailsRepository;
    private final TransactionTypeRepository transactionTypeRepository;
    private final TransactionPurposeRepository transactionPurposeRepository;
    private final TransactionStatusRepository transactionStatusRepository;
    private final TransactionSubcategoryRepository transactionSubcategoryRepository;
    private final WalletRepository walletRepository;
    private final ReceiptAttachmentRepository receiptAttachmentRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final TransactionDetailsService transactionDetailsService;
    private final LoanHistoryService loanHistoryService;

    @Override
    @Transactional
    public TransactionResponse createTransaction(Long userId, TransactionRequest request) {
        if (request.getTotalAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(ErrorCode.INVALID_AMOUNT);
        }

        TransactionType transactionType = transactionTypeRepository.findById(request.getTransactionTypeId())
                .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST, "Transaction type not found"));

        TransactionPurpose purpose = transactionPurposeRepository.findById(request.getTransactionPurposeId())
                .orElseThrow(() -> new BusinessException(ErrorCode.TRANSACTION_PURPOSE_NOT_FOUND));

        TransactionStatus status = transactionStatusRepository.findById(request.getTransactionStatusId())
                .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST, "Transaction status not found"));

        TransactionSubcategory subcategory = null;
        if (request.getTransactionSubcategoryId() != null) {
            subcategory = transactionSubcategoryRepository.findById(request.getTransactionSubcategoryId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST, "Subcategory not found"));
        }

        ReceiptAttachment attachment = null;
        if (request.getAttachmentId() != null) {
            attachment = receiptAttachmentRepository.findById(request.getAttachmentId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST, "Attachment not found"));
        }

        String typeCode = transactionType.getCode();
        String subcategoryCode = subcategory != null ? subcategory.getCode() : null;

        if ("LOAN".equals(typeCode) && (subcategoryCode == null || !List.of("RECEIVABLE", "PAYABLE").contains(subcategoryCode))) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Loan transactions require subcategory: RECEIVABLE or PAYABLE");
        }

        validateWalletEntries(userId, request.getWalletEntries(), typeCode, request.getTotalAmount(), subcategoryCode);

        TransactionHistory history = TransactionHistory.builder()
                .userId(userId)
                .totalAmount(request.getTotalAmount())
                .description(request.getDescription())
                .personName(request.getPersonName())
                .transactionType(transactionType)
                .transactionPurpose(purpose)
                .transactionStatus(status)
                .transactionSubcategory(subcategory)
                .transactionDate(request.getTransactionDate())
                .referenceNumber(request.getReferenceNumber())
                .notes(request.getNotes())
                .attachment(attachment)
                .build();
        history = transactionHistoryRepository.save(history);

        List<TransactionDetails> detailsList = transactionDetailsService.createTransactionDetails(
                userId, history, typeCode, request.getWalletEntries());

        if ("LOAN".equals(typeCode) && subcategoryCode != null) {
            for (TransactionDetails detail : detailsList) {
                loanHistoryService.processLoanTransaction(userId, history, detail, subcategoryCode);
            }
            log.info("Loan processing completed for transaction: historyId={}", history.getId());
        }

        log.info("Transaction created: historyId={}, userId={}, type={}, entries={}",
                history.getId(), userId, typeCode, detailsList.size());
        return toResponse(history, detailsList);
    }

    private void validateWalletEntries(Long userId, List<TransactionRequest.WalletEntry> entries, String typeCode, BigDecimal totalAmount, String subcategoryCode) {
        if (entries == null || entries.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "At least one wallet entry is required");
        }

        BigDecimal sumAmounts = BigDecimal.ZERO;
        for (TransactionRequest.WalletEntry entry : entries) {
            if (entry.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessException(ErrorCode.INVALID_AMOUNT, "Each entry amount must be positive");
            }
            sumAmounts = sumAmounts.add(entry.getAmount());

            if ("INCOME".equals(typeCode) || "EXPENSE".equals(typeCode) || "LOAN".equals(typeCode)) {
                if (entry.getWalletId() == null) {
                    throw new BusinessException(ErrorCode.BAD_REQUEST, "Wallet ID is required for each income/expense entry");
                }
                Wallet wallet = walletRepository.findByIdForUpdate(entry.getWalletId())
                        .orElseThrow(() -> new BusinessException(ErrorCode.WALLET_NOT_FOUND));
                if (!wallet.getUserId().equals(userId)) {
                    throw new BusinessException(ErrorCode.ACCESS_DENIED);
                }
                if (!"ACTIVE".equals(wallet.getStatus())) {
                    throw new BusinessException(ErrorCode.BAD_REQUEST, "Wallet is not active: " + wallet.getWalletName());
                }
                if (("EXPENSE".equals(typeCode) || ("LOAN".equals(typeCode) && "RECEIVABLE".equals(subcategoryCode)))
                        && wallet.getCurrentBalance().compareTo(entry.getAmount()) < 0) {
                    throw new BusinessException(ErrorCode.INSUFFICIENT_BALANCE,
                            "Insufficient balance in wallet: " + wallet.getWalletName());
                }
            }

            if ("TRANSFER".equals(typeCode)) {
                if (entry.getSourceWalletId() == null || entry.getDestinationWalletId() == null) {
                    throw new BusinessException(ErrorCode.BAD_REQUEST, "Source and destination wallet IDs are required for each transfer entry");
                }
                if (entry.getSourceWalletId().equals(entry.getDestinationWalletId())) {
                    throw new BusinessException(ErrorCode.INVALID_TRANSACTION,
                            "Source and destination wallets must be different");
                }
                Wallet source = walletRepository.findByIdForUpdate(entry.getSourceWalletId())
                        .orElseThrow(() -> new BusinessException(ErrorCode.WALLET_NOT_FOUND));
                Wallet destination = walletRepository.findByIdForUpdate(entry.getDestinationWalletId())
                        .orElseThrow(() -> new BusinessException(ErrorCode.WALLET_NOT_FOUND));
                if (!source.getUserId().equals(userId) || !destination.getUserId().equals(userId)) {
                    throw new BusinessException(ErrorCode.ACCESS_DENIED);
                }
                if (!"ACTIVE".equals(source.getStatus()) || !"ACTIVE".equals(destination.getStatus())) {
                    throw new BusinessException(ErrorCode.BAD_REQUEST, "Both source and destination wallets must be active");
                }
                if (source.getCurrentBalance().compareTo(entry.getAmount()) < 0) {
                    throw new BusinessException(ErrorCode.INSUFFICIENT_BALANCE,
                            "Insufficient balance in source wallet: " + source.getWalletName());
                }
            }
        }

        if (sumAmounts.compareTo(totalAmount) != 0) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Sum of entry amounts (" + sumAmounts + ") must equal total amount (" + totalAmount + ")");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public TransactionResponse getTransaction(Long userId, Long transactionId) {
        TransactionHistory history = transactionHistoryRepository.findById(transactionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.TRANSACTION_NOT_FOUND));

        if (!history.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }

        List<TransactionDetails> detailsList = transactionDetailsRepository.findByTransactionHistoryId(transactionId);
        return toResponse(history, detailsList);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TransactionResponse> getUserTransactions(Long userId) {
        return transactionHistoryRepository.findByUserId(userId).stream()
                .map(history -> {
                    List<TransactionDetails> detailsList = transactionDetailsRepository.findByTransactionHistoryId(history.getId());
                    return toResponse(history, detailsList);
                })
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<LedgerEntryResponse> getTransactionLedger(Long userId, Long transactionId) {
        TransactionHistory history = transactionHistoryRepository.findById(transactionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.TRANSACTION_NOT_FOUND));

        if (!history.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }

        List<TransactionDetails> detailsList = transactionDetailsRepository.findByTransactionHistoryId(transactionId);
        return detailsList.stream()
                .flatMap(t -> ledgerEntryRepository.findByTransactionDetailsId(t.getId()).stream())
                .map(this::toLedgerResponse)
                .toList();
    }

    private TransactionResponse toResponse(TransactionHistory history, List<TransactionDetails> detailsList) {
        List<TransactionResponse.WalletEntryResponse> walletEntries = detailsList.stream()
                .map(t -> TransactionResponse.WalletEntryResponse.builder()
                        .transactionId(t.getId())
                        .walletId(t.getWallet() != null ? t.getWallet().getId() : null)
                        .sourceWalletId(t.getSourceWallet() != null ? t.getSourceWallet().getId() : null)
                        .destinationWalletId(t.getDestinationWallet() != null ? t.getDestinationWallet().getId() : null)
                        .amount(t.getAmount())
                        .merchant(t.getMerchant())
                        .build())
                .toList();

        return TransactionResponse.builder()
                .id(history.getId())
                .transactionHistoryId(history.getId())
                .userId(history.getUserId())
                .transactionTypeCode(history.getTransactionType().getCode())
                .transactionPurposeCode(history.getTransactionPurpose().getCode())
                .transactionStatusCode(history.getTransactionStatus().getCode())
                .subcategoryCode(history.getTransactionSubcategory() != null ? history.getTransactionSubcategory().getCode() : null)
                .totalAmount(history.getTotalAmount())
                .description(history.getDescription())
                .personName(history.getPersonName())
                .transactionDate(history.getTransactionDate())
                .referenceNumber(history.getReferenceNumber())
                .notes(history.getNotes())
                .attachmentId(history.getAttachment() != null ? history.getAttachment().getId() : null)
                .walletEntries(walletEntries)
                .createdAt(history.getCreatedAt())
                .build();
    }

    private LedgerEntryResponse toLedgerResponse(LedgerEntry entry) {
        return LedgerEntryResponse.builder()
                .id(entry.getId())
                .transactionId(entry.getTransactionDetails().getId())
                .userId(entry.getUserId())
                .walletId(entry.getWallet().getId())
                .debit(entry.getDebit())
                .credit(entry.getCredit())
                .balanceAfter(entry.getBalanceAfter())
                .remarks(entry.getRemarks())
                .createdAt(entry.getCreatedAt())
                .build();
    }
}
