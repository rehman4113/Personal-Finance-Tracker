package com.rehman.finance.finance.service.impl;

import com.rehman.finance.finance.dto.request.PurposeRequest;
import com.rehman.finance.finance.dto.request.SubcategoryRequest;
import com.rehman.finance.finance.dto.response.MasterDataResponse.SimpleMasterItem;
import com.rehman.finance.finance.entity.TransactionPurpose;
import com.rehman.finance.finance.entity.TransactionSubcategory;
import com.rehman.finance.finance.entity.TransactionType;
import com.rehman.finance.exception.BusinessException;
import com.rehman.finance.exception.ErrorCode;
import com.rehman.finance.finance.repository.TransactionPurposeRepository;
import com.rehman.finance.finance.repository.TransactionSubcategoryRepository;
import com.rehman.finance.finance.repository.TransactionTypeRepository;
import com.rehman.finance.finance.service.PurposeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

/**
 * User-ownable purposes/subcategories created from dropdowns (creatable selects).
 * System seeds have userId == null and are read-only; user items are soft-deleted
 * (active=false) so historical transactions keep their references intact.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PurposeServiceImpl implements PurposeService {

    private static final int CODE_MAX = 30;

    private final TransactionPurposeRepository purposeRepository;
    private final TransactionSubcategoryRepository subcategoryRepository;
    private final TransactionTypeRepository transactionTypeRepository;

    @Override
    @Transactional
    public SimpleMasterItem createPurpose(Long userId, PurposeRequest request) {
        TransactionType type = transactionTypeRepository.findById(request.getTransactionTypeId())
                .orElseThrow(() -> new BusinessException(ErrorCode.TRANSACTION_PURPOSE_NOT_FOUND,
                        "Transaction type not found: " + request.getTransactionTypeId()));

        String name = request.getName().trim();
        if (purposeRepository.existsByUserIdAndNameAndTransactionTypeId(userId, name, type.getId())) {
            throw new BusinessException(ErrorCode.PURPOSE_CODE_EXISTS,
                    "Purpose already exists: " + name);
        }

        TransactionPurpose purpose = TransactionPurpose.builder()
                .transactionType(type)
                .userId(userId)
                .code(generateUniqueCode(name, purposeRepository::existsByCode))
                .name(name)
                .description(trimToNull(request.getDescription()))
                .active(true)
                .build();

        purpose = purposeRepository.save(purpose);
        log.info("Purpose created: id={}, userId={}, code={}", purpose.getId(), userId, purpose.getCode());
        return toSimpleItem(purpose);
    }

    @Override
    @Transactional
    public void deletePurpose(Long userId, Long purposeId) {
        TransactionPurpose purpose = purposeRepository.findById(purposeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.TRANSACTION_PURPOSE_NOT_FOUND));

        if (purpose.getUserId() == null) {
            throw new BusinessException(ErrorCode.PURPOSE_NOT_DELETABLE);
        }
        if (!purpose.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }

        purpose.setActive(false);
        purposeRepository.save(purpose);
        log.info("Purpose soft-deleted: id={}", purposeId);
    }

    @Override
    @Transactional
    public SimpleMasterItem createSubcategory(Long userId, Long purposeId, SubcategoryRequest request) {
        TransactionPurpose purpose = purposeRepository.findById(purposeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.TRANSACTION_PURPOSE_NOT_FOUND));
        if (purpose.getUserId() != null && !purpose.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }

        String name = request.getName().trim();
        if (subcategoryRepository.existsByUserIdAndNameAndTransactionPurposeId(userId, name, purposeId)) {
            throw new BusinessException(ErrorCode.SUBCATEGORY_CODE_EXISTS,
                    "Subcategory already exists: " + name);
        }

        TransactionSubcategory subcategory = TransactionSubcategory.builder()
                .transactionPurpose(purpose)
                .userId(userId)
                .code(generateUniqueCode(name, subcategoryRepository::existsByCode))
                .name(name)
                .description(trimToNull(request.getDescription()))
                .active(true)
                .build();

        subcategory = subcategoryRepository.save(subcategory);
        log.info("Subcategory created: id={}, userId={}, code={}", subcategory.getId(), userId, subcategory.getCode());
        return toSimpleItem(subcategory);
    }

    @Override
    @Transactional
    public void deleteSubcategory(Long userId, Long subcategoryId) {
        TransactionSubcategory subcategory = subcategoryRepository.findById(subcategoryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SUBCATEGORY_NOT_FOUND));

        if (subcategory.getUserId() == null) {
            throw new BusinessException(ErrorCode.SUBCATEGORY_NOT_DELETABLE);
        }
        if (!subcategory.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }

        subcategory.setActive(false);
        subcategoryRepository.save(subcategory);
        log.info("Subcategory soft-deleted: id={}", subcategoryId);
    }

    /** Slug from name: COFFEE_SHOP → COFFEE_SHOP; deduped COFFEE_SHOP_2 … */
    private String generateUniqueCode(String name, java.util.function.Predicate<String> exists) {
        String base = name.toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9]+", "_")
                .replaceAll("_+", "_")
                .replaceAll("^_|_$", "");
        if (base.isEmpty()) base = "ITEM";
        if (base.length() > CODE_MAX) base = base.substring(0, CODE_MAX);

        String code = base;
        int suffix = 2;
        while (exists.test(code)) {
            code = base.substring(0, Math.min(CODE_MAX - 2, base.length())) + "_" + suffix++;
        }
        return code;
    }

    private SimpleMasterItem toSimpleItem(TransactionPurpose purpose) {
        return SimpleMasterItem.builder()
                .id(purpose.getId())
                .code(purpose.getCode())
                .name(purpose.getName())
                .description(purpose.getDescription())
                .active(purpose.getActive())
                .userId(purpose.getUserId())
                .build();
    }

    private SimpleMasterItem toSimpleItem(TransactionSubcategory subcategory) {
        return SimpleMasterItem.builder()
                .id(subcategory.getId())
                .code(subcategory.getCode())
                .name(subcategory.getName())
                .description(subcategory.getDescription())
                .active(subcategory.getActive())
                .userId(subcategory.getUserId())
                .build();
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }
}
