package com.rehman.finance.finance.controller;

import com.rehman.finance.auth.security.UserPrincipal;
import com.rehman.finance.finance.api.FinanceApi;
import com.rehman.finance.finance.dto.request.PurposeRequest;
import com.rehman.finance.finance.dto.request.SubcategoryRequest;
import com.rehman.finance.finance.dto.response.MasterDataResponse.SimpleMasterItem;
import com.rehman.finance.finance.service.PurposeService;
import com.rehman.finance.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Purpose Management", description = "Endpoints for user-created purposes and subcategories (creatable dropdowns)")
@RestController
@RequiredArgsConstructor
public class PurposeController {

    private final PurposeService purposeService;

    @Operation(summary = "Create a new transaction purpose (e.g. a new income type or expense category)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Purpose created"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Purpose already exists")
    })
    @PostMapping(FinanceApi.Purpose.BASE)
    public ResponseEntity<ApiResponse<SimpleMasterItem>> createPurpose(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody PurposeRequest request) {
        SimpleMasterItem response = purposeService.createPurpose(currentUser.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Purpose created", response));
    }

    @Operation(summary = "Delete a user-created purpose (soft delete — hidden from dropdowns)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Purpose deleted"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Cannot delete system purpose"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Purpose not found")
    })
    @DeleteMapping(FinanceApi.Purpose.BASE + "/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePurpose(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id) {
        purposeService.deletePurpose(currentUser.getUserId(), id);
        return ResponseEntity.ok(ApiResponse.success("Purpose deleted", null));
    }

    @Operation(summary = "Create a new subcategory under a purpose (e.g. an expense sub category)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Subcategory created"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Purpose not found")
    })
    @PostMapping(FinanceApi.Purpose.subcategoriesOf)
    public ResponseEntity<ApiResponse<SimpleMasterItem>> createSubcategory(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long purposeId,
            @Valid @RequestBody SubcategoryRequest request) {
        SimpleMasterItem response = purposeService.createSubcategory(currentUser.getUserId(), purposeId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Subcategory created", response));
    }

    @Operation(summary = "Delete a user-created subcategory (soft delete — hidden from dropdowns)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Subcategory deleted"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Cannot delete system subcategory"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Subcategory not found")
    })
    @DeleteMapping(FinanceApi.Subcategory.BASE + "/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSubcategory(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id) {
        purposeService.deleteSubcategory(currentUser.getUserId(), id);
        return ResponseEntity.ok(ApiResponse.success("Subcategory deleted", null));
    }

}
