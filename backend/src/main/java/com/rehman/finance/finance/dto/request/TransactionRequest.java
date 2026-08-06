package com.rehman.finance.finance.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(name = "TransactionRequest")
public class TransactionRequest {

    @NotNull(message = "Transaction type ID is required")
    private Long transactionTypeId;

    @NotNull(message = "Transaction purpose ID is required")
    private Long transactionPurposeId;

    @NotNull(message = "Transaction status ID is required")
    private Long transactionStatusId;

    private Long transactionSubcategoryId;

    @NotNull(message = "Total amount is required")
    @Positive(message = "Total amount must be positive")
    private BigDecimal totalAmount;

    @NotNull(message = "Transaction date is required")
    private LocalDateTime transactionDate;

    private String description;

    @Schema(description = "Person who gave/received money")
    private String personName;

    private String referenceNumber;

    private String notes;

    private Long attachmentId;

    @Schema(description = "Loan user ID (LOAN transactions only). When provided, the history is linked " +
            "to the loan user by ID and its full name is used as the person name.")
    private Long loanUserId;

    @NotEmpty(message = "At least one wallet entry is required")
    @Valid
    private List<WalletEntry> walletEntries;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WalletEntry {

        @Schema(description = "Wallet ID (for income/expense)")
        private Long walletId;

        @Schema(description = "Source wallet ID (for transfer)")
        private Long sourceWalletId;

        @Schema(description = "Destination wallet ID (for transfer)")
        private Long destinationWalletId;

        @NotNull(message = "Entry amount is required")
        @Positive(message = "Entry amount must be positive")
        private BigDecimal amount;

        private String merchant;
    }
}
