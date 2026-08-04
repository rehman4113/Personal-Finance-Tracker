package com.rehman.finance.finance.repository;

import com.rehman.finance.finance.entity.LoanHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoanHistoryRepository extends JpaRepository<LoanHistory, Long> {
    List<LoanHistory> findByLoanUserId(Long loanUserId);

    List<LoanHistory> findByTransactionHistoryId(Long transactionHistoryId);
}
