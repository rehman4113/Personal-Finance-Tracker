package com.rehman.finance.finance.service;

import com.rehman.finance.finance.dto.request.TransactionRequest;
import com.rehman.finance.finance.dto.response.TransactionDetailResponse;
import com.rehman.finance.finance.entity.TransactionDetails;
import com.rehman.finance.finance.entity.TransactionHistory;
import com.rehman.finance.response.PageResponse;

import java.util.List;

public interface TransactionDetailsService {

    List<TransactionDetails> createTransactionDetails(Long userId, TransactionHistory history, String typeCode, List<TransactionRequest.WalletEntry> entries);

    TransactionDetailResponse getTransactionDetailsById(Long userId, Long id);

    PageResponse<TransactionDetailResponse> getTransactionDetailsByUserId(Long userId, int page, int size);

    List<TransactionDetailResponse> getTransactionDetailsByUserIdAndHistoryId(Long userId, Long transactionHistoryId);

}
