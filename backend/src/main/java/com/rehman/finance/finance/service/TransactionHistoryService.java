package com.rehman.finance.finance.service;

import com.rehman.finance.finance.dto.request.TransactionRequest;
import com.rehman.finance.finance.dto.response.LedgerEntryResponse;
import com.rehman.finance.finance.dto.response.TransactionResponse;

import java.util.List;

public interface TransactionHistoryService {

    TransactionResponse createTransaction(Long userId, TransactionRequest request);

    TransactionResponse getTransaction(Long userId, Long transactionId);

    List<TransactionResponse> getUserTransactions(Long userId);

    List<LedgerEntryResponse> getTransactionLedger(Long userId, Long transactionId);

}
