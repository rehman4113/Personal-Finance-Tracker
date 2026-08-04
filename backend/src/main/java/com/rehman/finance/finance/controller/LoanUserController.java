package com.rehman.finance.finance.controller;

import com.rehman.finance.auth.security.UserPrincipal;
import com.rehman.finance.finance.api.FinanceApi;
import com.rehman.finance.finance.dto.request.LoanUserRequest;
import com.rehman.finance.finance.dto.response.LoanHistoryResponse;
import com.rehman.finance.finance.dto.response.LoanUserResponse;
import com.rehman.finance.finance.service.LoanHistoryService;
import com.rehman.finance.finance.service.LoanUserService;
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

@Tag(name = "Loan User Management", description = "Endpoints for managing loan users (people with whom you have loan relationships)")
@RestController
@RequestMapping(FinanceApi.LoanUser.BASE)
@RequiredArgsConstructor
public class LoanUserController {

    private final LoanUserService loanUserService;
    private final LoanHistoryService loanHistoryService;

    @Operation(summary = "Create a new loan user")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Loan user created"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Loan user already exists")
    })
    @PostMapping
    public ResponseEntity<ApiResponse<LoanUserResponse>> createLoanUser(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody LoanUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Loan user created", loanUserService.createLoanUser(currentUser.getUserId(), request)));
    }

    @Operation(summary = "Get loan user by ID")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Loan user found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Loan user not found")
    })
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LoanUserResponse>> getLoanUser(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(loanUserService.getLoanUser(currentUser.getUserId(), id)));
    }

    @Operation(summary = "Get all user loan users")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "List of loan users")
    })
    @GetMapping
    public ResponseEntity<ApiResponse<List<LoanUserResponse>>> getUserLoanUsers(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(ApiResponse.success(loanUserService.getUserLoanUsers(currentUser.getUserId())));
    }

    @Operation(summary = "Update a loan user")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Loan user updated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Loan user not found")
    })
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<LoanUserResponse>> updateLoanUser(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id,
            @Valid @RequestBody LoanUserRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Loan user updated", loanUserService.updateLoanUser(currentUser.getUserId(), id, request)));
    }

    @Operation(summary = "Get loan history for a loan user")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "List of loan history records"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Loan user not found")
    })
    @GetMapping("/{id}/history")
    public ResponseEntity<ApiResponse<List<LoanHistoryResponse>>> getLoanHistory(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(loanHistoryService.getLoanHistoryByUser(currentUser.getUserId(), id)));
    }

}
