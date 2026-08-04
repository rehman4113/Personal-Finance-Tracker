package com.rehman.finance.finance.controller;

import com.rehman.finance.auth.security.UserPrincipal;
import com.rehman.finance.finance.api.FinanceApi;
import com.rehman.finance.finance.dto.request.BudgetRequest;
import com.rehman.finance.finance.dto.response.BudgetResponse;
import com.rehman.finance.finance.service.BudgetService;
import com.rehman.finance.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Budget Management", description = "Endpoints for managing budget limits")
@RestController
@RequestMapping(FinanceApi.Budget.BASE)
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;

    @Operation(summary = "Create a budget limit")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Budget created"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Duplicate budget for this purpose and month")
    })
    @PostMapping
    public ResponseEntity<ApiResponse<BudgetResponse>> createBudget(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody BudgetRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Budget created", budgetService.createBudget(currentUser.getUserId(), request)));
    }

    @Operation(summary = "Get budget by ID")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Budget found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Budget not found")
    })
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BudgetResponse>> getBudget(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(budgetService.getBudget(currentUser.getUserId(), id)));
    }

    @Operation(summary = "Get budgets for a month")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "List of budgets")
    })
    @GetMapping
    public ResponseEntity<ApiResponse<List<BudgetResponse>>> getUserBudgetsForMonth(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam String month) {
        return ResponseEntity.ok(ApiResponse.success(budgetService.getUserBudgetsForMonth(currentUser.getUserId(), month)));
    }

    @Operation(summary = "Update a budget limit")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Budget updated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Budget not found")
    })
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BudgetResponse>> updateBudget(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id,
            @Valid @RequestBody BudgetRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Budget updated", budgetService.updateBudget(currentUser.getUserId(), id, request)));
    }

    @Operation(summary = "Delete a budget limit")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Budget deleted"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Budget not found")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBudget(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id) {
        budgetService.deleteBudget(currentUser.getUserId(), id);
        return ResponseEntity.ok(ApiResponse.success("Budget deleted", null));
    }

}
