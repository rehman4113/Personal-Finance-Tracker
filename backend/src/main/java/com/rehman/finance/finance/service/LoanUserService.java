package com.rehman.finance.finance.service;

import com.rehman.finance.finance.dto.request.LoanUserRequest;
import com.rehman.finance.finance.dto.response.LoanUserResponse;

import java.util.List;

public interface LoanUserService {

    LoanUserResponse createLoanUser(Long userId, LoanUserRequest request);

    LoanUserResponse getLoanUser(Long userId, Long loanUserId);

    List<LoanUserResponse> getUserLoanUsers(Long userId);

    LoanUserResponse updateLoanUser(Long userId, Long loanUserId, LoanUserRequest request);

}
