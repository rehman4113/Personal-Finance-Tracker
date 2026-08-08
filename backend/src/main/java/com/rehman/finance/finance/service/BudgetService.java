package com.rehman.finance.finance.service;

import com.rehman.finance.finance.dto.request.BudgetRequest;
import com.rehman.finance.finance.dto.response.BudgetResponse;
import com.rehman.finance.response.PageResponse;

public interface BudgetService {

    BudgetResponse createBudget(Long userId, BudgetRequest request);

    BudgetResponse getBudget(Long userId, Long budgetId);

    PageResponse<BudgetResponse> getUserBudgetsForMonth(Long userId, String month, int page, int size);

    BudgetResponse updateBudget(Long userId, Long budgetId, BudgetRequest request);

    void deleteBudget(Long userId, Long budgetId);

}
