package com.rehman.finance.finance.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "pf_fi_wallets", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "wallet_type_id", "account_number"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Wallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wallet_type_id", nullable = false)
    private WalletType walletType;

    @Column(name = "wallet_name", length = 100)
    private String walletName;

    @Column(length = 10)
    private String currency;

    @Column(name = "initial_balance", precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal initialBalance = BigDecimal.ZERO;

    @Column(name = "current_balance", precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal currentBalance = BigDecimal.ZERO;

    @Column(name = "account_number", length = 100)
    private String accountNumber;

    /** TRUE for the auto-created 'System' CASH wallet — never deletable. */
    @Column(name = "is_system", nullable = false)
    @Builder.Default
    private Boolean system = false;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 20)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

}
