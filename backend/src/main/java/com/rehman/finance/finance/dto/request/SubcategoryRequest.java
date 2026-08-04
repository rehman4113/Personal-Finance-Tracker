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
@Schema(name = "SubcategoryRequest")
public class SubcategoryRequest {

    @NotBlank(message = "Name is required")
    @Schema(description = "Subcategory display name", example = "Cappuccino")
    private String name;

    @Schema(description = "Description", example = "Coffee shop purchases")
    private String description;

}
