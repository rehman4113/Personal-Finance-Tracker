package com.rehman.finance.finance.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pf_fi_transaction_purpose")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionPurpose {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_type_id", nullable = false)
    private TransactionType transactionType;

    /** NULL = system seed (not deletable); set = created by this user from a dropdown. */
    @Column(name = "user_id")
    private Long userId;

    @Column(unique = true, length = 30)
    private String code;

    @Column(length = 100)
    private String name;

    @Column(length = 255)
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

}
