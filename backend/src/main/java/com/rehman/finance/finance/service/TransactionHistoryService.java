package com.rehman.finance.finance.service;

import com.rehman.finance.finance.dto.request.TransactionFilter;
import com.rehman.finance.finance.dto.request.TransactionRequest;
import com.rehman.finance.finance.dto.response.LedgerEntryResponse;
import com.rehman.finance.finance.dto.response.TransactionResponse;
import com.rehman.finance.response.PageResponse;

import java.util.List;

public interface TransactionHistoryService {

    TransactionResponse createTransaction(Long userId, TransactionRequest request);

    TransactionResponse getTransaction(Long userId, Long transactionId);

    PageResponse<TransactionResponse> getUserTransactions(Long userId, int page, int size, TransactionFilter filter);

    List<LedgerEntryResponse> getTransactionLedger(Long userId, Long transactionId);

}
