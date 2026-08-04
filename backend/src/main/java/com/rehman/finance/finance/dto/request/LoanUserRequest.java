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
@Schema(name = "LoanUserRequest")
public class LoanUserRequest {

    @NotBlank(message = "Full name is required")
    @Schema(description = "Full name of the person", example = "Ahmed Khan")
    private String fullName;

    @Schema(description = "Contact number", example = "03001234567")
    private String contactNumber;

    @Schema(description = "Notes about this person")
    private String notes;
}
