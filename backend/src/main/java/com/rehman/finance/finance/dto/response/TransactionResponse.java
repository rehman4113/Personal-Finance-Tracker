package com.rehman.finance.finance.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
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
@Schema(name = "TransactionResponse")
public class TransactionResponse {

    private Long id;
    private Long transactionHistoryId;
    private Long userId;
    private String transactionTypeCode;
    private String transactionPurposeCode;
    private String transactionStatusCode;
    private String subcategoryCode;
    private BigDecimal totalAmount;
    private String description;
    private String personName;
    private LocalDateTime transactionDate;
    private String referenceNumber;
    private String notes;
    private Long attachmentId;
    private List<WalletEntryResponse> walletEntries;
    private LocalDateTime createdAt;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WalletEntryResponse {
        private Long transactionId;
        private Long walletId;
        private Long sourceWalletId;
        private Long destinationWalletId;
        private BigDecimal amount;
        private String merchant;
    }
}
