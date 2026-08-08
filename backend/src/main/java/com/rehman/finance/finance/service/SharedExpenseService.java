package com.rehman.finance.finance.service;

import com.rehman.finance.finance.dto.request.SharedExpenseRequest;
import com.rehman.finance.finance.dto.response.SharedExpenseResponse;
import com.rehman.finance.response.PageResponse;

public interface SharedExpenseService {

    SharedExpenseResponse createSharedExpense(Long userId, SharedExpenseRequest request);

    SharedExpenseResponse getSharedExpense(Long userId, Long expenseId);

    PageResponse<SharedExpenseResponse> getUserSharedExpenses(Long userId, int page, int size);

    void settleMember(Long userId, Long expenseId, Long memberId);

}
