package com.rehman.finance.finance.entity;

import jakarta.persistence.*;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "pf_fi_shared_expense_members", uniqueConstraints = @UniqueConstraint(columnNames = {"shared_expense_id", "member_name"}))
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SharedExpenseMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shared_expense_id", nullable = false)
    private SharedExpense sharedExpense;

    @Column(name = "member_name", nullable = false, length = 150)
    private String memberName;

    @Column(name = "share_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal shareAmount;

    @Column(nullable = false)
    @Builder.Default
    private Boolean settled = false;

    @Column(name = "settled_date")
    private LocalDateTime settledDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

}
