package com.rehman.finance.finance.repository;

import com.rehman.finance.finance.entity.TransactionHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TransactionHistoryRepository extends JpaRepository<TransactionHistory, Long> {
    List<TransactionHistory> findByUserId(Long userId);
}
