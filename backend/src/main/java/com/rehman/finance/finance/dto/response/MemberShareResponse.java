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
@Schema(name = "MemberShareResponse")
public class MemberShareResponse {

    private Long id;
    private String memberName;
    private BigDecimal shareAmount;
    private Boolean settled;
    private LocalDateTime settledDate;
    private LocalDateTime createdAt;

}
