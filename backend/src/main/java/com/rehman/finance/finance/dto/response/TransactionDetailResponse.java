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
@Schema(name = "TransactionDetailResponse")
public class TransactionDetailResponse {

    private Long id;
    private Long transactionHistoryId;
    private Long userId;
    private Long walletId;
    private String walletName;
    private String walletTypeCode;
    private String walletTypeName;
    private String currency;
    private Long sourceWalletId;
    private String sourceWalletName;
    private Long destinationWalletId;
    private String destinationWalletName;
    private BigDecimal amount;
    private String merchant;
    private LocalDateTime createdAt;

}
