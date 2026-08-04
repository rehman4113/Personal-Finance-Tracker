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
@Schema(name = "WalletResponse")
public class WalletResponse {

    private Long id;
    private Long userId;
    private String walletTypeCode;
    private String walletTypeName;
    private String walletName;
    private String currency;
    private BigDecimal initialBalance;
    private BigDecimal currentBalance;
    private String accountNumber;
    private String description;
    private String status;
    private Boolean system;
    private LocalDateTime createdAt;

}
