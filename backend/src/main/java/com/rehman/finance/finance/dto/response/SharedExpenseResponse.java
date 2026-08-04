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
@Schema(name = "SharedExpenseResponse")
public class SharedExpenseResponse {

    private Long id;
    private Long userId;
    private BigDecimal totalAmount;
    private String description;
    private String splitType;
    private Integer numMembers;
    private LocalDateTime expenseDate;
    private List<MemberShareResponse> members;
    private LocalDateTime createdAt;

}
