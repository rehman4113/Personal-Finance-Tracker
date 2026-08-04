package com.rehman.finance.finance.controller;

import com.rehman.finance.auth.security.UserPrincipal;
import com.rehman.finance.finance.api.FinanceApi;
import com.rehman.finance.finance.dto.request.WalletTypeRequest;
import com.rehman.finance.finance.dto.response.WalletTypeResponse;
import com.rehman.finance.finance.service.WalletTypeService;
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

@Tag(name = "Wallet Type Management", description = "Endpoints for managing user wallet types")
@RestController
@RequestMapping(FinanceApi.Wallet.BASE + "/types")
@RequiredArgsConstructor
public class WalletTypeController {

    private final WalletTypeService walletTypeService;

    @Operation(summary = "Create a new wallet type")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Wallet type created"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Wallet type code already exists")
    })
    @PostMapping
    public ResponseEntity<ApiResponse<WalletTypeResponse>> createWalletType(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody WalletTypeRequest request) {
        WalletTypeResponse response = walletTypeService.createWalletType(currentUser.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Wallet type created", response));
    }

    @Operation(summary = "Get wallet type by ID")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Wallet type found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Wallet type not found")
    })
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WalletTypeResponse>> getWalletType(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(walletTypeService.getWalletType(currentUser.getUserId(), id)));
    }

    @Operation(summary = "Get all wallet types for the user (includes system defaults)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "List of wallet types")
    })
    @GetMapping
    public ResponseEntity<ApiResponse<List<WalletTypeResponse>>> getUserWalletTypes(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(ApiResponse.success(walletTypeService.getUserWalletTypes(currentUser.getUserId())));
    }

    @Operation(summary = "Update a wallet type")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Wallet type updated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Cannot modify system default"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Wallet type not found")
    })
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<WalletTypeResponse>> updateWalletType(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id,
            @Valid @RequestBody WalletTypeRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Wallet type updated", walletTypeService.updateWalletType(currentUser.getUserId(), id, request)));
    }

    @Operation(summary = "Delete a wallet type")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Wallet type deleted"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Cannot delete system default"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Wallet type not found")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteWalletType(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id) {
        walletTypeService.deleteWalletType(currentUser.getUserId(), id);
        return ResponseEntity.ok(ApiResponse.success("Wallet type deleted", null));
    }

}
