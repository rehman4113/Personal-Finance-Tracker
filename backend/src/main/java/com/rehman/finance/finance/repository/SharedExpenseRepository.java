package com.rehman.finance.finance.repository;

import com.rehman.finance.finance.entity.SharedExpense;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SharedExpenseRepository extends JpaRepository<SharedExpense, Long> {
    List<SharedExpense> findByUserId(Long userId);
}
