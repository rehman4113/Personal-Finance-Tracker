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
@Table(name = "pf_fi_loan_history")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoanHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_user_id", nullable = false)
    private LoanUser loanUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_history_id")
    private TransactionHistory transactionHistory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_detail_id")
    private TransactionDetails transactionDetail;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(name = "previous_amount", precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal previousAmount = BigDecimal.ZERO;

    @Column(name = "current_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal currentAmount;

    @Column(name = "previous_status", length = 20)
    private String previousStatus;

    @Column(name = "current_status", nullable = false, length = 20)
    private String currentStatus;

    @Column(name = "transaction_type", nullable = false, length = 20)
    private String transactionType;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

}
