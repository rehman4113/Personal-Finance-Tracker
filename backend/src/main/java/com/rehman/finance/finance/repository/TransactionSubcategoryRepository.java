package com.rehman.finance.finance.repository;

import com.rehman.finance.finance.entity.TransactionSubcategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TransactionSubcategoryRepository extends JpaRepository<TransactionSubcategory, Long> {
    Optional<TransactionSubcategory> findByCode(String code);

    boolean existsByCode(String code);

    boolean existsByUserIdAndNameAndTransactionPurposeId(Long userId, String name, Long transactionPurposeId);
}
