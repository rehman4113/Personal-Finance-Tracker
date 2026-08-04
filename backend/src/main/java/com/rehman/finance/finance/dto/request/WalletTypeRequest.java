package com.rehman.finance.finance.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
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
@Schema(name = "WalletTypeRequest")
public class WalletTypeRequest {

    @NotBlank(message = "Code is required")
    @Schema(description = "Unique wallet type code", example = "BANK")
    private String code;

    @NotBlank(message = "Name is required")
    @Schema(description = "Wallet type display name", example = "Bank Account")
    private String name;

    @Schema(description = "Description", example = "Standard bank account")
    private String description;

}
