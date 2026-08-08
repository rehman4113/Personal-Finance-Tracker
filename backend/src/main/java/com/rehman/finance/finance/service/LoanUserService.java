package com.rehman.finance.finance.service;

import com.rehman.finance.finance.dto.request.LoanUserRequest;
import com.rehman.finance.finance.dto.response.LoanTotalsResponse;
import com.rehman.finance.finance.dto.response.LoanUserResponse;
import com.rehman.finance.response.PageResponse;

public interface LoanUserService {

    LoanUserResponse createLoanUser(Long userId, LoanUserRequest request);

    LoanUserResponse getLoanUser(Long userId, Long loanUserId);

    PageResponse<LoanUserResponse> getUserLoanUsers(Long userId, int page, int size);

    LoanUserResponse updateLoanUser(Long userId, Long loanUserId, LoanUserRequest request);

    LoanTotalsResponse getLoanTotals(Long userId);

}
