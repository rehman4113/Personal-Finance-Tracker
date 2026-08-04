package com.rehman.finance.finance.service;

import com.rehman.finance.finance.dto.request.WalletTypeRequest;
import com.rehman.finance.finance.dto.response.WalletTypeResponse;

import java.util.List;

public interface WalletTypeService {

    WalletTypeResponse createWalletType(Long userId, WalletTypeRequest request);

    WalletTypeResponse getWalletType(Long userId, Long walletTypeId);

    List<WalletTypeResponse> getUserWalletTypes(Long userId);

    WalletTypeResponse updateWalletType(Long userId, Long walletTypeId, WalletTypeRequest request);

    void deleteWalletType(Long userId, Long walletTypeId);

}
