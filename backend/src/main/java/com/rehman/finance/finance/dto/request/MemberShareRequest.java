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

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(name = "MemberShareRequest")
public class MemberShareRequest {

    @NotBlank(message = "Member name is required")
    @Schema(description = "Member name", example = "Ali")
    private String memberName;

    @NotNull(message = "Share amount is required")
    @Positive(message = "Share amount must be positive")
    @Schema(description = "Share amount", example = "750.00")
    private BigDecimal shareAmount;

}
