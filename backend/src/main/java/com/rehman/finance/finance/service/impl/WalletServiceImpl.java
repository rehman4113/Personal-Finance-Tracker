package com.rehman.finance.finance.service.impl;

import com.rehman.finance.exception.BusinessException;
import com.rehman.finance.exception.ErrorCode;
import com.rehman.finance.finance.dto.request.WalletRequest;
import com.rehman.finance.finance.dto.response.WalletResponse;
import com.rehman.finance.finance.entity.Wallet;
import com.rehman.finance.finance.entity.WalletType;
import com.rehman.finance.finance.repository.WalletRepository;
import com.rehman.finance.finance.repository.WalletTypeRepository;
import com.rehman.finance.finance.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class WalletServiceImpl implements WalletService {

    private final WalletRepository walletRepository;
    private final WalletTypeRepository walletTypeRepository;

    @Override
    @Transactional
    public WalletResponse createWallet(Long userId, WalletRequest request) {
        if (request.getInitialBalance() != null && request.getInitialBalance().compareTo(java.math.BigDecimal.ZERO) < 0) {
            throw new BusinessException(ErrorCode.INVALID_AMOUNT, "Initial balance cannot be negative");
        }
        WalletType walletType = walletTypeRepository.findByIdAndUserIdOrUserIdIsNull(request.getWalletTypeId(), userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.WALLET_TYPE_NOT_FOUND));
        if (request.getAccountNumber() != null && walletRepository.existsByUserIdAndWalletTypeIdAndAccountNumber(
                userId, request.getWalletTypeId(), request.getAccountNumber())) {
            throw new BusinessException(ErrorCode.DUPLICATE_WALLET);
        }
        Wallet wallet = Wallet.builder()
                .userId(userId)
                .walletType(walletType)
                .walletName(request.getWalletName())
                .currency(request.getCurrency() != null ? request.getCurrency() : "PKR")
                .initialBalance(request.getInitialBalance() != null ? request.getInitialBalance() : java.math.BigDecimal.ZERO)
                .currentBalance(request.getInitialBalance() != null ? request.getInitialBalance() : java.math.BigDecimal.ZERO)
                .accountNumber(request.getAccountNumber())
                .description(request.getDescription())
                .status("ACTIVE")
                .build();

        wallet = walletRepository.save(wallet);
        log.info("Wallet created: id={}, userId={}", wallet.getId(), userId);
        return toResponse(wallet);
    }

    @Override
    @Transactional
    public WalletResponse createSystemWallet(Long userId) {
        Wallet existing = walletRepository.findFirstByUserIdAndSystemTrue(userId);
        if (existing != null) {
            log.info("System wallet already exists for user id={}, reusing id={}", userId, existing.getId());
            return toResponse(existing);
        }
        WalletType cashType = walletTypeRepository.findByCode("CASH").orElseGet(() ->
                walletTypeRepository.save(WalletType.builder()
                        .userId(null)
                        .code("CASH")
                        .name("Cash")
                        .description("Physical cash on hand")
                        .active(true)
                        .build()));
        Wallet wallet = Wallet.builder()
                .userId(userId)
                .walletType(cashType)
                .walletName("CASH")
                .currency("PKR")
                .initialBalance(java.math.BigDecimal.ZERO)
                .currentBalance(java.math.BigDecimal.ZERO)
                .description("Default system wallet")
                .status("ACTIVE")
                .system(true)
                .build();
        wallet = walletRepository.save(wallet);
        log.info("System wallet created: id={}, userId={}", wallet.getId(), userId);
        return toResponse(wallet);
    }

    @Override
    @Transactional(readOnly = true)
    public WalletResponse getWallet(Long userId, Long walletId) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new BusinessException(ErrorCode.WALLET_NOT_FOUND));

        if (!wallet.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }
        return toResponse(wallet);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WalletResponse> getUserWallets(Long userId) {
        return walletRepository.findByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public WalletResponse updateWallet(Long userId, Long walletId, WalletRequest request) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new BusinessException(ErrorCode.WALLET_NOT_FOUND));
        if (!wallet.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }

        WalletType walletType = walletTypeRepository.findByIdAndUserIdOrUserIdIsNull(request.getWalletTypeId(), userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.WALLET_TYPE_NOT_FOUND));

        wallet.setWalletType(walletType);
        wallet.setWalletName(request.getWalletName());
        if (request.getCurrency() != null) wallet.setCurrency(request.getCurrency());
        if (request.getAccountNumber() != null) wallet.setAccountNumber(request.getAccountNumber());
        if (request.getDescription() != null) wallet.setDescription(request.getDescription());

        if (request.getAccountNumber() != null && walletRepository.existsByUserIdAndWalletTypeIdAndAccountNumberAndIdNot(
                userId, walletType.getId(), request.getAccountNumber(), walletId)) {
            throw new BusinessException(ErrorCode.DUPLICATE_WALLET);
        }

        wallet = walletRepository.save(wallet);
        log.info("Wallet updated: id={}", wallet.getId());
        return toResponse(wallet);
    }

    @Override
    @Transactional
    public void deleteWallet(Long userId, Long walletId) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new BusinessException(ErrorCode.WALLET_NOT_FOUND));

        if (!wallet.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }
        if (Boolean.TRUE.equals(wallet.getSystem())) {
            throw new BusinessException(ErrorCode.WALLET_NOT_DELETABLE);
        }
        wallet.setStatus("CLOSED");
        walletRepository.save(wallet);
        log.info("Wallet closed: id={}", walletId);
    }

    private WalletResponse toResponse(Wallet wallet) {
        return WalletResponse.builder()
                .id(wallet.getId())
                .userId(wallet.getUserId())
                .walletTypeCode(wallet.getWalletType().getCode())
                .walletTypeName(wallet.getWalletType().getName())
                .walletName(wallet.getWalletName())
                .currency(wallet.getCurrency())
                .initialBalance(wallet.getInitialBalance())
                .currentBalance(wallet.getCurrentBalance())
                .accountNumber(wallet.getAccountNumber())
                .description(wallet.getDescription())
                .status(wallet.getStatus())
                .system(wallet.getSystem())
                .createdAt(wallet.getCreatedAt())
                .build();
    }

    // also make api to deactive or activate the wallet
}
