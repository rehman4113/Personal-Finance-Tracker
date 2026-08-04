package com.rehman.finance.finance.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(name = "WalletTypeResponse")
public class WalletTypeResponse {

    private Long id;
    private Long userId;
    private String code;
    private String name;
    private String description;
    private Boolean active;
    private Boolean systemDefault;

}
