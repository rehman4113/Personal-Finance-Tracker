package com.rehman.finance.finance.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(name = "WalletRequest")
public class WalletRequest {

    @NotNull(message = "Wallet type ID is required")
    @Schema(description = "Wallet type ID", example = "1")
    private Long walletTypeId;

    @NotBlank(message = "Wallet name is required")
    @Schema(description = "Wallet name", example = "My Cash Wallet")
    private String walletName;

    @Schema(description = "Currency code", example = "PKR")
    private String currency;

    @PositiveOrZero(message = "Initial balance must be zero or positive")
    @Schema(description = "Initial balance", example = "1000.00")
    private BigDecimal initialBalance;

    @Schema(description = "Account number", example = "1234567890")
    private String accountNumber;

    @Schema(description = "Description")
    private String description;

}
