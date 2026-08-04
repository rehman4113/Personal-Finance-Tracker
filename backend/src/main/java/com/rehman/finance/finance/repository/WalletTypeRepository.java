package com.rehman.finance.finance.repository;

import com.rehman.finance.finance.entity.WalletType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WalletTypeRepository extends JpaRepository<WalletType, Long> {

    Optional<WalletType> findByCode(String code);

    List<WalletType> findByUserIdOrUserIdIsNull(Long userId);

    @Query("select w from WalletType w where w.id = :id and (w.userId is null or w.userId = :userId)")
    Optional<WalletType> findByIdAndUserIdOrUserIdIsNull(@Param("id") Long id, @Param("userId") Long userId);

    boolean existsByCode(String code);

    boolean existsByUserIdAndCode(Long userId, String code);

    boolean existsByUserIdAndCodeAndIdNot(Long userId, String code, Long id);

}
