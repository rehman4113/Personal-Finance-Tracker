package com.rehman.finance.finance.service;

import com.rehman.finance.finance.dto.request.WalletRequest;
import com.rehman.finance.finance.dto.response.WalletResponse;

import java.util.List;

public interface WalletService {

    WalletResponse createWallet(Long userId, WalletRequest request);

    /** Creates the non-deletable 'System' CASH wallet for a freshly registered user. */
    WalletResponse createSystemWallet(Long userId);

    WalletResponse getWallet(Long userId, Long walletId);

    List<WalletResponse> getUserWallets(Long userId);

    WalletResponse updateWallet(Long userId, Long walletId, WalletRequest request);

    void deleteWallet(Long userId, Long walletId);

}
