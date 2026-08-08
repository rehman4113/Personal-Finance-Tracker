package com.rehman.finance.finance.repository;

import com.rehman.finance.finance.entity.BudgetLimit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BudgetLimitRepository extends JpaRepository<BudgetLimit, Long> {
    List<BudgetLimit> findByUserIdAndMonth(Long userId, String month);

    Page<BudgetLimit> findByUserIdAndMonth(Long userId, String month, Pageable pageable);
    Optional<BudgetLimit> findByUserIdAndTransactionPurposeIdAndMonth(Long userId, Long transactionPurposeId, String month);
    Optional<BudgetLimit> findByUserIdAndTransactionPurposeIdAndMonthAndIdNot(Long userId, Long transactionPurposeId, String month, Long id);
}
