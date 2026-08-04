package com.rehman.finance.finance.repository;

import com.rehman.finance.finance.entity.TransactionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TransactionStatusRepository extends JpaRepository<TransactionStatus, Long> {
    Optional<TransactionStatus> findByCode(String code);
}
