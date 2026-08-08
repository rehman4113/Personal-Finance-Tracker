package com.rehman.finance.finance.controller;

import com.rehman.finance.auth.security.UserPrincipal;
import com.rehman.finance.finance.api.FinanceApi;
import com.rehman.finance.finance.dto.response.LoanHistoryResponse;
import com.rehman.finance.finance.service.LoanHistoryService;
import com.rehman.finance.response.ApiResponse;
import com.rehman.finance.response.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Loan History", description = "Combined loan-history listing with optional per-loan-user filtering")
@RestController
@RequestMapping(FinanceApi.LoanHistory.BASE)
@RequiredArgsConstructor
public class LoanHistoryController {

    private final LoanHistoryService loanHistoryService;

    @Operation(summary = "Get loan history (all loan users, optionally filtered to one)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Paginated loan history"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Loan user not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied")
    })
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<LoanHistoryResponse>>> getLoanHistory(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(required = false) Long loanUserId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                loanHistoryService.getLoanHistory(currentUser.getUserId(), loanUserId, status, from, to, page, size)));
    }

}