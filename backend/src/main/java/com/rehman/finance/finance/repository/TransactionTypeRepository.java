package com.rehman.finance.finance.repository;

import com.rehman.finance.finance.entity.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TransactionTypeRepository extends JpaRepository<TransactionType, Long> {
    Optional<TransactionType> findByCode(String code);
}
