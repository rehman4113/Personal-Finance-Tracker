package com.rehman.finance.finance.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
@Schema(name = "PurposeRequest")
public class PurposeRequest {

    @NotNull(message = "Transaction type is required")
    @Schema(description = "Transaction type id the purpose belongs to", example = "1")
    private Long transactionTypeId;

    @NotBlank(message = "Name is required")
    @Schema(description = "Purpose display name", example = "Coffee")
    private String name;

    @Schema(description = "Description", example = "Coffee shop purchases")
    private String description;

}
