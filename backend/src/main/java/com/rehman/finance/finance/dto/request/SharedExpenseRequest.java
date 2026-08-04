package com.rehman.finance.finance.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
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
@Schema(name = "SharedExpenseRequest")
public class SharedExpenseRequest {

    @NotNull(message = "Total amount is required")
    @Positive(message = "Total amount must be positive")
    @Schema(description = "Total expense amount", example = "3000.00")
    private BigDecimal totalAmount;

    @Schema(description = "Description", example = "Electricity bill")
    private String description;

    @NotBlank(message = "Split type is required")
    @Schema(description = "Split type (EQUAL/MANUAL)", example = "EQUAL")
    private String splitType;

    @Schema(description = "Number of members (for EQUAL split)", example = "4")
    private Integer numMembers;

    @Schema(description = "Member shares (for MANUAL split)")
    private List<MemberShareRequest> members;

    @NotNull(message = "Expense date is required")
    @Schema(description = "Expense date")
    private LocalDateTime expenseDate;

}
