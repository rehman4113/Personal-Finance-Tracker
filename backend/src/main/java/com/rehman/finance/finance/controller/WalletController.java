package com.rehman.finance.finance.controller;

import com.rehman.finance.auth.security.UserPrincipal;
import com.rehman.finance.finance.api.FinanceApi;
import com.rehman.finance.finance.dto.request.WalletRequest;
import com.rehman.finance.finance.dto.response.WalletResponse;
import com.rehman.finance.finance.service.WalletService;
import com.rehman.finance.response.ApiResponse;
import com.rehman.finance.response.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Wallet Management", description = "Endpoints for managing user wallets")
@RestController
@RequestMapping(FinanceApi.Wallet.BASE)
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    @Operation(summary = "Create a new wallet")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Wallet created successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Wallet type not found")
    })
    @PostMapping
    public ResponseEntity<ApiResponse<WalletResponse>> createWallet(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody WalletRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Wallet created", walletService.createWallet(currentUser.getUserId(), request)));
    }

    @Operation(summary = "Get wallet by ID")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Wallet found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Wallet not found")
    })
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WalletResponse>> getWallet(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(walletService.getWallet(currentUser.getUserId(), id)));
    }

    @Operation(summary = "Get all user wallets (paginated)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Paginated list of wallets")
    })
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<WalletResponse>>> getUserWallets(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(walletService.getUserWallets(currentUser.getUserId(), page, size)));
    }

    @Operation(summary = "Update a wallet")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Wallet updated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Wallet not found")
    })
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<WalletResponse>> updateWallet(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id,
            @Valid @RequestBody WalletRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Wallet updated", walletService.updateWallet(currentUser.getUserId(), id, request)));
    }

    @Operation(summary = "Close (soft delete) a wallet")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Wallet closed"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Wallet not found")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteWallet(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id) {
        walletService.deleteWallet(currentUser.getUserId(), id);
        return ResponseEntity.ok(ApiResponse.success("Wallet closed", null));
    }

}
