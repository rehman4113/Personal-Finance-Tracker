package com.rehman.finance.finance.repository;

import com.rehman.finance.finance.entity.TransactionDetails;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TransactionDetailsRepository extends JpaRepository<TransactionDetails, Long> {
    List<TransactionDetails> findByUserId(Long userId);

    Page<TransactionDetails> findByUserId(Long userId, Pageable pageable);

    List<TransactionDetails> findByTransactionHistoryId(Long transactionHistoryId);
    List<TransactionDetails> findByUserIdAndTransactionHistoryId(Long userId, Long transactionHistoryId);
}
