package com.rehman.finance.finance.controller;

import com.rehman.finance.auth.security.UserPrincipal;
import com.rehman.finance.finance.api.FinanceApi;
import com.rehman.finance.finance.dto.request.TransactionRequest;
import com.rehman.finance.finance.dto.response.LedgerEntryResponse;
import com.rehman.finance.finance.dto.response.TransactionResponse;
import com.rehman.finance.finance.service.TransactionHistoryService;
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

@Tag(name = "Transaction History Management", description = "Endpoints for managing transaction history records")
@RestController
@RequestMapping(FinanceApi.TransactionHistory.BASE)
@RequiredArgsConstructor
public class TransactionHistoryController {

    private final TransactionHistoryService transactionHistoryService;

    @Operation(summary = "Create a new transaction (income/expense/transfer)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Transaction created"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request or insufficient balance"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Related entity not found")
    })
    @PostMapping
    public ResponseEntity<ApiResponse<TransactionResponse>> createTransaction(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody TransactionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Transaction created", transactionHistoryService.createTransaction(currentUser.getUserId(), request)));
    }

    @Operation(summary = "Get transaction by ID")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Transaction found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Transaction not found")
    })
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TransactionResponse>> getTransaction(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(transactionHistoryService.getTransaction(currentUser.getUserId(), id)));
    }

    @Operation(summary = "Get all user transactions")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "List of transactions")
    })
    @GetMapping
    public ResponseEntity<ApiResponse<List<TransactionResponse>>> getUserTransactions(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(ApiResponse.success(transactionHistoryService.getUserTransactions(currentUser.getUserId())));
    }

    @Operation(summary = "Get ledger entries for a transaction")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "List of ledger entries"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Transaction not found")
    })
    @GetMapping("/{id}/ledger")
    public ResponseEntity<ApiResponse<List<LedgerEntryResponse>>> getTransactionLedger(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(transactionHistoryService.getTransactionLedger(currentUser.getUserId(), id)));
    }

}
