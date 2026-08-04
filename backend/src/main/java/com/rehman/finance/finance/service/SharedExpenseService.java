package com.rehman.finance.finance.service;

import com.rehman.finance.finance.dto.request.SharedExpenseRequest;
import com.rehman.finance.finance.dto.response.SharedExpenseResponse;

import java.util.List;

public interface SharedExpenseService {

    SharedExpenseResponse createSharedExpense(Long userId, SharedExpenseRequest request);

    SharedExpenseResponse getSharedExpense(Long userId, Long expenseId);

    List<SharedExpenseResponse> getUserSharedExpenses(Long userId);

    void settleMember(Long userId, Long expenseId, Long memberId);

}
