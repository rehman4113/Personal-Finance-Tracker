package com.rehman.finance.finance.repository;

import com.rehman.finance.finance.entity.SharedExpenseMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SharedExpenseMemberRepository extends JpaRepository<SharedExpenseMember, Long> {
    List<SharedExpenseMember> findBySharedExpenseId(Long sharedExpenseId);
}
