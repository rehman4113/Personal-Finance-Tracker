package com.rehman.finance.finance.controller;

import com.rehman.finance.auth.security.UserPrincipal;
import com.rehman.finance.finance.api.FinanceApi;
import com.rehman.finance.finance.dto.response.MasterDataResponse;
import com.rehman.finance.finance.service.MasterDataService;
import com.rehman.finance.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Master Data", description = "Endpoints for retrieving master/reference data")
@RestController
@RequestMapping(FinanceApi.Master.BASE)
@RequiredArgsConstructor
public class MasterController {

    private final MasterDataService masterDataService;

    @Operation(summary = "Get all master data (wallet types, transaction types, purposes, statuses)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Master data retrieved")
    })
    @GetMapping
    public ResponseEntity<ApiResponse<MasterDataResponse>> getAllMasterData(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(ApiResponse.success(masterDataService.getAllMasterData(currentUser.getUserId())));
    }

}
