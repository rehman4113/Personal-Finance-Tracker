package com.rehman.finance.finance.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(name = "LoanHistoryResponse")
public class LoanHistoryResponse {

    private Long id;
    private Long loanUserId;
    private Long transactionHistoryId;
    private Long transactionDetailId;
    private BigDecimal amount;
    private BigDecimal previousAmount;
    private BigDecimal currentAmount;
    private String previousStatus;
    private String currentStatus;
    private String transactionType;
    private String remarks;
    private LocalDateTime createdAt;
}
