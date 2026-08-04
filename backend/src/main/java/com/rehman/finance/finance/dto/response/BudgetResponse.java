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
@Schema(name = "BudgetResponse")
public class BudgetResponse {

    private Long id;
    private Long userId;
    private String purposeCode;
    private String purposeName;
    private BigDecimal monthlyLimit;
    private String month;
    private Integer warningThreshold;
    private BigDecimal totalSpent;
    private BigDecimal remaining;
    private Integer usagePercentage;
    private String alertLevel;
    private LocalDateTime createdAt;

}
