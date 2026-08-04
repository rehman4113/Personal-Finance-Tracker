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
@Schema(name = "LoanUserResponse")
public class LoanUserResponse {

    private Long id;
    private Long userId;
    private String fullName;
    private String contactNumber;
    private String uniqueKey;
    private BigDecimal currentAmount;
    private String loanStatus;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
