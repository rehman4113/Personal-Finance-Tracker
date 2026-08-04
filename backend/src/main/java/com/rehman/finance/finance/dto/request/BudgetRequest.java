package com.rehman.finance.finance.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
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
@Schema(name = "BudgetRequest")
public class BudgetRequest {

    @NotNull(message = "Transaction purpose ID is required")
    @Schema(description = "Transaction purpose ID", example = "1")
    private Long transactionPurposeId;

    @NotNull(message = "Monthly limit is required")
    @Positive(message = "Monthly limit must be positive")
    @Schema(description = "Monthly budget limit", example = "5000.00")
    private BigDecimal monthlyLimit;

    @NotBlank(message = "Month is required")
    @Schema(description = "Budget month (YYYY-MM)", example = "2026-07")
    private String month;

    @Min(value = 1, message = "Warning threshold must be at least 1")
    @Max(value = 100, message = "Warning threshold must be at most 100")
    @Schema(description = "Warning threshold percentage", example = "80")
    private Integer warningThreshold;

}
