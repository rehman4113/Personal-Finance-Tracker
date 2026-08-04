package com.rehman.finance.finance.repository;

import com.rehman.finance.finance.entity.TransactionPurpose;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TransactionPurposeRepository extends JpaRepository<TransactionPurpose, Long> {
    Optional<TransactionPurpose> findByCode(String code);

    boolean existsByCode(String code);

    boolean existsByUserIdAndNameAndTransactionTypeId(Long userId, String name, Long transactionTypeId);

    List<TransactionPurpose> findByUserId(Long userId);
}
