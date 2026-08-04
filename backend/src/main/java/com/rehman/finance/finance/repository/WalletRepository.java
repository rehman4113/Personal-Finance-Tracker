package com.rehman.finance.finance.repository;

import com.rehman.finance.finance.entity.Wallet;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WalletRepository extends JpaRepository<Wallet, Long> {
    List<Wallet> findByUserId(Long userId);

    Wallet findFirstByUserIdAndSystemTrue(Long userId);

    boolean existsByUserIdAndWalletTypeIdAndAccountNumber(Long userId, Long walletTypeId, String accountNumber);

    boolean existsByUserIdAndWalletTypeIdAndAccountNumberAndIdNot(Long userId, Long walletTypeId, String accountNumber, Long id);

    boolean existsByWalletTypeId(Long walletTypeId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select w from Wallet w where w.id = :id")
    Optional<Wallet> findByIdForUpdate(@Param("id") Long id);
}
