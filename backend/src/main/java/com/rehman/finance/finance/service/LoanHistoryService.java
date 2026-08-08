package com.rehman.finance.finance.service;

import com.rehman.finance.finance.dto.response.LoanHistoryResponse;
import com.rehman.finance.finance.entity.TransactionDetails;
import com.rehman.finance.finance.entity.TransactionHistory;
import com.rehman.finance.response.PageResponse;

public interface LoanHistoryService {

    void processLoanTransaction(Long userId, TransactionHistory history, TransactionDetails details, String subcategoryCode);

    PageResponse<LoanHistoryResponse> getLoanHistoryByUser(Long userId, Long loanUserId, int page, int size);

    /**
     * Combined loan-history view. When {@code loanUserId} is null, returns
     * history across ALL of the user's loan users; otherwise filters to the
     * given loan user (ownership verified against {@code userId}). Optional
     * {@code status} ({@code RECEIVABLE}/{@code PAYABLE}/{@code CLOSED}) and
     * {@code from}/{@code to} (ISO LocalDateTime) further narrow the result.
     */
    PageResponse<LoanHistoryResponse> getLoanHistory(Long userId, Long loanUserId, String status, String from, String to, int page, int size);

}
