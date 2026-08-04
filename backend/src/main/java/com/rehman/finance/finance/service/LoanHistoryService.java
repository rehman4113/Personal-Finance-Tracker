package com.rehman.finance.finance.service;

import com.rehman.finance.finance.dto.response.LoanHistoryResponse;
import com.rehman.finance.finance.entity.TransactionDetails;
import com.rehman.finance.finance.entity.TransactionHistory;

import java.util.List;

public interface LoanHistoryService {

    void processLoanTransaction(Long userId, TransactionHistory history, TransactionDetails details, String subcategoryCode);

    List<LoanHistoryResponse> getLoanHistoryByUser(Long userId, Long loanUserId);

}
