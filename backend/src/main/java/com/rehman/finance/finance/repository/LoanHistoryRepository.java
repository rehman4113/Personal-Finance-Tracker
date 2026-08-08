package com.rehman.finance.finance.repository;

import com.rehman.finance.finance.entity.LoanHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface LoanHistoryRepository extends JpaRepository<LoanHistory, Long> {
    List<LoanHistory> findByLoanUserId(Long loanUserId);

    List<LoanHistory> findByLoanUserIdOrderByCreatedAtDesc(Long loanUserId);

    Page<LoanHistory> findByLoanUserIdOrderByCreatedAtDesc(Long loanUserId, Pageable pageable);

    /**
     * All loan history belonging to any loan user of the given user
     * (multi-user view — supports the combined loan-history listing).
     */
    Page<LoanHistory> findByLoanUserUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /**
     * Single-user view within the multi-user endpoint (ownership still enforced).
     */
    Page<LoanHistory> findByLoanUserIdAndLoanUserUserIdOrderByCreatedAtDesc(Long loanUserId, Long userId, Pageable pageable);

    /**
     * Filtered loan history — optional per-loan-user, current loan status and
     * created-at range. All optional params are NULL-aware.
     *
     * NOTE: date filters are compared via a coalesce() with a cast fallback so
     * Postgres can infer the parameter type when a null range bound is passed
     * (otherwise: "could not determine data type of parameter").
     */
    @Query("""
            select lh from LoanHistory lh
            where lh.loanUser.userId = :userId
              and (:loanUserId is null or lh.loanUser.id = :loanUserId)
              and (:status is null or lh.loanUser.loanStatus = :status)
              and (lh.createdAt >= coalesce(:from, cast('1900-01-01' as timestamp)))
              and (lh.createdAt < coalesce(:to, cast('9999-12-31' as timestamp)))
            order by lh.createdAt desc
            """)
    Page<LoanHistory> search(
            @Param("userId") Long userId,
            @Param("loanUserId") Long loanUserId,
            @Param("status") String status,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable);

    List<LoanHistory> findByTransactionHistoryId(Long transactionHistoryId);
}
