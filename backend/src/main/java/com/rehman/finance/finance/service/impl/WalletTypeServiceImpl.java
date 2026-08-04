package com.rehman.finance.finance.service.impl;

import com.rehman.finance.finance.dto.request.WalletTypeRequest;
import com.rehman.finance.finance.dto.response.WalletTypeResponse;
import com.rehman.finance.finance.entity.WalletType;
import com.rehman.finance.exception.BusinessException;
import com.rehman.finance.exception.ErrorCode;
import com.rehman.finance.finance.repository.WalletTypeRepository;
import com.rehman.finance.finance.repository.WalletRepository;
import com.rehman.finance.finance.service.WalletTypeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class WalletTypeServiceImpl implements WalletTypeService {

    private final WalletTypeRepository walletTypeRepository;
    private final WalletRepository walletRepository;

    @Override
    @Transactional
    public WalletTypeResponse createWalletType(Long userId, WalletTypeRequest request) {
        String code = request.getCode().toUpperCase();
        if (walletTypeRepository.existsByUserIdAndCode(userId, code)) {
            throw new BusinessException(ErrorCode.WALLET_TYPE_CODE_EXISTS);
        }
        if (walletTypeRepository.findByCode(code)
                .map(WalletType::isSystemDefault)
                .orElse(false)) {
            throw new BusinessException(ErrorCode.WALLET_TYPE_CODE_EXISTS, "Code is reserved for a system wallet type: " + code);
        }

        WalletType walletType = WalletType.builder()
                .userId(userId)
                .code(code)
                .name(request.getName())
                .description(request.getDescription())
                .active(true)
                .build();

        walletType = walletTypeRepository.save(walletType);
        log.info("Wallet type created: id={}, userId={}, code={}", walletType.getId(), userId, request.getCode());
        return toResponse(walletType);
    }

    @Override
    @Transactional(readOnly = true)
    public WalletTypeResponse getWalletType(Long userId, Long walletTypeId) {
        WalletType walletType = walletTypeRepository.findById(walletTypeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.WALLET_TYPE_NOT_FOUND));

        if (walletType.getUserId() != null && !walletType.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }
        return toResponse(walletType);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WalletTypeResponse> getUserWalletTypes(Long userId) {
        return walletTypeRepository.findByUserIdOrUserIdIsNull(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public WalletTypeResponse updateWalletType(Long userId, Long walletTypeId, WalletTypeRequest request) {
        WalletType walletType = walletTypeRepository.findById(walletTypeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.WALLET_TYPE_NOT_FOUND));

        if (walletType.isSystemDefault()) {
            throw new BusinessException(ErrorCode.WALLET_TYPE_NOT_MODIFIABLE);
        }

        if (walletType.getUserId() != null && !walletType.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }

        if (walletTypeRepository.existsByUserIdAndCodeAndIdNot(userId, request.getCode().toUpperCase(), walletTypeId)) {
            throw new BusinessException(ErrorCode.WALLET_TYPE_CODE_EXISTS);
        }

        walletType.setCode(request.getCode().toUpperCase());
        walletType.setName(request.getName());
        walletType.setDescription(request.getDescription());

        walletType = walletTypeRepository.save(walletType);
        log.info("Wallet type updated: id={}", walletType.getId());
        return toResponse(walletType);
    }

    @Override
    @Transactional
    public void deleteWalletType(Long userId, Long walletTypeId) {
        WalletType walletType = walletTypeRepository.findById(walletTypeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.WALLET_TYPE_NOT_FOUND));

        if (walletType.isSystemDefault()) {
            throw new BusinessException(ErrorCode.WALLET_TYPE_NOT_DELETABLE);
        }

        if (walletType.getUserId() != null && !walletType.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }

        if (walletRepository.existsByWalletTypeId(walletTypeId)) {
            throw new BusinessException(ErrorCode.WALLET_TYPE_NOT_DELETABLE, "Cannot delete wallet type that is in use by one or more wallets");
        }

        walletTypeRepository.delete(walletType);
        log.info("Wallet type deleted: id={}", walletTypeId);
    }

    private WalletTypeResponse toResponse(WalletType walletType) {
        return WalletTypeResponse.builder()
                .id(walletType.getId())
                .userId(walletType.getUserId())
                .code(walletType.getCode())
                .name(walletType.getName())
                .description(walletType.getDescription())
                .active(walletType.getActive())
                .systemDefault(walletType.isSystemDefault())
                .build();
    }

}
