package com.rehman.finance.finance.controller;

import com.rehman.finance.auth.security.UserPrincipal;
import com.rehman.finance.finance.api.FinanceApi;
import com.rehman.finance.finance.dto.response.TransactionDetailResponse;
import com.rehman.finance.finance.service.TransactionDetailsService;
import com.rehman.finance.response.ApiResponse;
import com.rehman.finance.response.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Transaction Details Management", description = "Endpoints for managing transaction detail entries")
@RestController
@RequestMapping(FinanceApi.TransactionDetails.BASE)
@RequiredArgsConstructor
public class TransactionDetailsController {

    private final TransactionDetailsService transactionDetailsService;

    @Operation(summary = "Get transaction detail by ID")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Transaction detail found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Transaction detail not found")
    })
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TransactionDetailResponse>> getTransactionDetail(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                transactionDetailsService.getTransactionDetailsById(currentUser.getUserId(), id)));
    }

    @Operation(summary = "Get all transaction details for a user (paginated)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Paginated list of transaction details")
    })
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<TransactionDetailResponse>>> getUserTransactionDetails(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                transactionDetailsService.getTransactionDetailsByUserId(currentUser.getUserId(), page, size)));
    }

    @Operation(summary = "Get transaction details by user ID and transaction history ID")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "List of transaction details")
    })
    @GetMapping("/by-history/{transactionHistoryId}")
    public ResponseEntity<ApiResponse<List<TransactionDetailResponse>>> getTransactionDetailsByUserAndHistory(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long transactionHistoryId) {
        return ResponseEntity.ok(ApiResponse.success(
                transactionDetailsService.getTransactionDetailsByUserIdAndHistoryId(currentUser.getUserId(), transactionHistoryId)));
    }
}
