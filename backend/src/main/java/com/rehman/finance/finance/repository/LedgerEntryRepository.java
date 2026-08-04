package com.rehman.finance.finance.repository;

import com.rehman.finance.finance.entity.LedgerEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, Long> {
    List<LedgerEntry> findByUserId(Long userId);
    List<LedgerEntry> findByWalletId(Long walletId);
    List<LedgerEntry> findByTransactionDetailsId(Long transactionDetailsId);
}
