package com.rehman.finance.finance.repository;

import com.rehman.finance.finance.entity.LoanUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LoanUserRepository extends JpaRepository<LoanUser, Long> {
    List<LoanUser> findByUserId(Long userId);

    Page<LoanUser> findByUserId(Long userId, Pageable pageable);

    Optional<LoanUser> findByUserIdAndUniqueKey(Long userId, String uniqueKey);

    Optional<LoanUser> findByUserIdAndId(Long userId, Long id);

    Optional<LoanUser> findByUserIdAndIdAndUniqueKey(Long userId, Long id, String uniqueKey);

    List<LoanUser> findByUserIdAndFullName(Long userId, String fullName);
}
