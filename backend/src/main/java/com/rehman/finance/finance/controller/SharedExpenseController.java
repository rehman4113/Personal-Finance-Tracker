package com.rehman.finance.finance.controller;

import com.rehman.finance.auth.security.UserPrincipal;
import com.rehman.finance.finance.api.FinanceApi;
import com.rehman.finance.finance.dto.request.SharedExpenseRequest;
import com.rehman.finance.finance.dto.response.SharedExpenseResponse;
import com.rehman.finance.finance.service.SharedExpenseService;
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

@Tag(name = "Shared Expense Management", description = "Endpoints for managing shared expenses and bill splitting")
@RestController
@RequestMapping(FinanceApi.SharedExpense.BASE)
@RequiredArgsConstructor
public class SharedExpenseController {

    private final SharedExpenseService sharedExpenseService;

    @Operation(summary = "Create a shared expense with members")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Shared expense created"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request")
    })
    @PostMapping
    public ResponseEntity<ApiResponse<SharedExpenseResponse>> createSharedExpense(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody SharedExpenseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Shared expense created", sharedExpenseService.createSharedExpense(currentUser.getUserId(), request)));
    }

    @Operation(summary = "Get shared expense by ID")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Shared expense found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Shared expense not found")
    })
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SharedExpenseResponse>> getSharedExpense(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(sharedExpenseService.getSharedExpense(currentUser.getUserId(), id)));
    }

    @Operation(summary = "Get all user shared expenses")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "List of shared expenses")
    })
    @GetMapping
    public ResponseEntity<ApiResponse<List<SharedExpenseResponse>>> getUserSharedExpenses(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(ApiResponse.success(sharedExpenseService.getUserSharedExpenses(currentUser.getUserId())));
    }

    @Operation(summary = "Settle a member's share")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Member settled"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Shared expense or member not found")
    })
    @PutMapping("/{expenseId}/settle/{memberId}")
    public ResponseEntity<ApiResponse<Void>> settleMember(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long expenseId,
            @PathVariable Long memberId) {
        sharedExpenseService.settleMember(currentUser.getUserId(), expenseId, memberId);
        return ResponseEntity.ok(ApiResponse.success("Member settled", null));
    }

}
