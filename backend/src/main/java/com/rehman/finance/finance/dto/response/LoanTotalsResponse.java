package com.rehman.finance.finance.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Aggregate loan exposure across all of a user's loan users.
 * RECEIVABLE = money others owe you (you are owed); PAYABLE = money you owe.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(name = "LoanTotalsResponse")
public class LoanTotalsResponse {

    private BigDecimal totalReceivable;

    private BigDecimal totalPayable;
}