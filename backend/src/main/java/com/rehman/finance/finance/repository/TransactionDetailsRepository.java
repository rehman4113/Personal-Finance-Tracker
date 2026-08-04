package com.rehman.finance.finance.repository;

import com.rehman.finance.finance.entity.TransactionDetails;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TransactionDetailsRepository extends JpaRepository<TransactionDetails, Long> {
    List<TransactionDetails> findByUserId(Long userId);
    List<TransactionDetails> findByTransactionHistoryId(Long transactionHistoryId);
    List<TransactionDetails> findByUserIdAndTransactionHistoryId(Long userId, Long transactionHistoryId);
}
