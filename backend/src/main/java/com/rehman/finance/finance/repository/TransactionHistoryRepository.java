package com.rehman.finance.finance.repository;

import com.rehman.finance.finance.entity.TransactionHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface TransactionHistoryRepository extends JpaRepository<TransactionHistory, Long> {
    List<TransactionHistory> findByUserId(Long userId);

    List<TransactionHistory> findByUserIdOrderByTransactionDateDescIdDesc(Long userId);

    /**
     * Server-side transaction list with optional filters. All filter params are
     * nullable: type/purpose/subcategory/status/code, from/to (inclusive date
     * window), walletId (matches ANY wallet entry/source/destination) and a
     * free-text search over description, person, reference, notes, purpose and
     * merchant. No filters behave exactly like {@code findByUserIdOrderBy...}.
     *
     * NOTE: date filters are compared via a coalesce() wrapper around a cast
     * so Postgres can infer the parameter type even when a null range bound is
     * supplied (otherwise: "could not determine data type of parameter").
     */
    @Query(value = """
             select h from TransactionHistory h
             left join h.transactionSubcategory subcat
             where h.userId = :userId
               and (:type is null or h.transactionType.code = :type)
               and (:status is null or h.transactionStatus.code = :status)
               and (:purpose is null or h.transactionPurpose.code = :purpose)
               and (:subcategory is null or subcat.code = :subcategory)
               and (h.transactionDate >= coalesce(:from, cast('1900-01-01' as timestamp)))
               and (h.transactionDate < coalesce(:to, cast('9999-12-31' as timestamp)))
               and (:walletId is null or exists (
                   select 1 from TransactionDetails d
                   where d.transactionHistory.id = h.id
                     and (d.wallet.id = :walletId or d.sourceWallet.id = :walletId or d.destinationWallet.id = :walletId)
               ))
               and (:search is null or
                   lower(coalesce(h.description, '')) like lower(concat('%', cast(:search as string), '%'))
                   or lower(coalesce(h.personName, '')) like lower(concat('%', cast(:search as string), '%'))
                   or lower(coalesce(h.referenceNumber, '')) like lower(concat('%', cast(:search as string), '%'))
                   or lower(coalesce(h.notes, '')) like lower(concat('%', cast(:search as string), '%'))
                   or lower(coalesce(h.transactionPurpose.name, '')) like lower(concat('%', cast(:search as string), '%'))
                   or exists (select 1 from TransactionDetails d2
                       where d2.transactionHistory.id = h.id
                         and lower(coalesce(d2.merchant, '')) like lower(concat('%', cast(:search as string), '%')))
               )
            """,
            countQuery = """
             select count(h) from TransactionHistory h
             left join h.transactionSubcategory subcat
             where h.userId = :userId
               and (:type is null or h.transactionType.code = :type)
               and (:status is null or h.transactionStatus.code = :status)
               and (:purpose is null or h.transactionPurpose.code = :purpose)
               and (:subcategory is null or subcat.code = :subcategory)
               and (h.transactionDate >= coalesce(:from, cast('1900-01-01' as timestamp)))
               and (h.transactionDate < coalesce(:to, cast('9999-12-31' as timestamp)))
               and (:walletId is null or exists (
                   select 1 from TransactionDetails d
                   where d.transactionHistory.id = h.id
                     and (d.wallet.id = :walletId or d.sourceWallet.id = :walletId or d.destinationWallet.id = :walletId)
               ))
               and (:search is null or
                   lower(coalesce(h.description, '')) like lower(concat('%', cast(:search as string), '%'))
                   or lower(coalesce(h.personName, '')) like lower(concat('%', cast(:search as string), '%'))
                   or lower(coalesce(h.referenceNumber, '')) like lower(concat('%', cast(:search as string), '%'))
                   or lower(coalesce(h.notes, '')) like lower(concat('%', cast(:search as string), '%'))
                   or lower(coalesce(h.transactionPurpose.name, '')) like lower(concat('%', cast(:search as string), '%'))
                   or exists (select 1 from TransactionDetails d2
                       where d2.transactionHistory.id = h.id
                         and lower(coalesce(d2.merchant, '')) like lower(concat('%', cast(:search as string), '%')))
               )
            """)
    Page<TransactionHistory> searchByFilters(
            @Param("userId") Long userId,
            @Param("type") String type,
            @Param("status") String status,
            @Param("purpose") String purpose,
            @Param("subcategory") String subcategory,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("walletId") Long walletId,
            @Param("search") String search,
            Pageable pageable);
}
