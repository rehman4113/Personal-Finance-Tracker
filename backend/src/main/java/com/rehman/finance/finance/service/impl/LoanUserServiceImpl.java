package com.rehman.finance.finance.service.impl;

import com.rehman.finance.exception.BusinessException;
import com.rehman.finance.exception.ErrorCode;
import com.rehman.finance.finance.dto.request.LoanUserRequest;
import com.rehman.finance.finance.dto.response.LoanUserResponse;
import com.rehman.finance.finance.entity.LoanUser;
import com.rehman.finance.finance.repository.LoanUserRepository;
import com.rehman.finance.finance.service.LoanUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class LoanUserServiceImpl implements LoanUserService {

    private final LoanUserRepository loanUserRepository;

    @Override
    @Transactional
    public LoanUserResponse createLoanUser(Long userId, LoanUserRequest request) {
        String uniqueKey = generateUniqueKey(request.getFullName(), request.getContactNumber());

        if (loanUserRepository.findByUserIdAndUniqueKey(userId, uniqueKey).isPresent()) {
            throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE, "Loan user already exists with this name and contact number");
        }

        LoanUser loanUser = LoanUser.builder()
                .userId(userId)
                .fullName(request.getFullName().trim())
                .contactNumber(request.getContactNumber() != null ? request.getContactNumber().trim() : null)
                .uniqueKey(uniqueKey)
                .currentAmount(java.math.BigDecimal.ZERO)
                .loanStatus("CLOSED")
                .notes(request.getNotes())
                .build();

        loanUser = loanUserRepository.save(loanUser);
        log.info("Loan user created: id={}, name={}", loanUser.getId(), request.getFullName());
        return toResponse(loanUser);
    }

    @Override
    @Transactional(readOnly = true)
    public LoanUserResponse getLoanUser(Long userId, Long loanUserId) {
        LoanUser loanUser = loanUserRepository.findById(loanUserId)
                .orElseThrow(() -> new BusinessException(ErrorCode.LOAN_USER_NOT_FOUND));

        if (!loanUser.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }
        return toResponse(loanUser);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LoanUserResponse> getUserLoanUsers(Long userId) {
        return loanUserRepository.findByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public LoanUserResponse updateLoanUser(Long userId, Long loanUserId, LoanUserRequest request) {
        LoanUser loanUser = loanUserRepository.findById(loanUserId)
                .orElseThrow(() -> new BusinessException(ErrorCode.LOAN_USER_NOT_FOUND));

        if (!loanUser.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }

        String newKey = generateUniqueKey(request.getFullName(), request.getContactNumber());
        loanUserRepository.findByUserIdAndUniqueKey(userId, newKey)
                .filter(u -> !u.getId().equals(loanUserId))
                .ifPresent(u -> {
                    throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE,
                            "Loan user already exists with this name and contact number");
                });

        loanUser.setFullName(request.getFullName().trim());
        loanUser.setContactNumber(request.getContactNumber() != null ? request.getContactNumber().trim() : null);
        loanUser.setNotes(request.getNotes());
        loanUser.setUniqueKey(newKey);

        loanUser = loanUserRepository.save(loanUser);
        log.info("Loan user updated: id={}", loanUser.getId());
        return toResponse(loanUser);
    }

    private String generateUniqueKey(String fullName, String contactNumber) {
        String name = fullName != null ? fullName.trim().toUpperCase().replaceAll("\\s+", "_") : "";
        String contact = contactNumber != null ? contactNumber.trim() : "";
        return name + "_" + contact;
    }

    private LoanUserResponse toResponse(LoanUser loanUser) {
        return LoanUserResponse.builder()
                .id(loanUser.getId())
                .userId(loanUser.getUserId())
                .fullName(loanUser.getFullName())
                .contactNumber(loanUser.getContactNumber())
                .uniqueKey(loanUser.getUniqueKey())
                .currentAmount(loanUser.getCurrentAmount())
                .loanStatus(loanUser.getLoanStatus())
                .notes(loanUser.getNotes())
                .createdAt(loanUser.getCreatedAt())
                .updatedAt(loanUser.getUpdatedAt())
                .build();
    }
}
