package com.rehman.finance.finance.api;

public interface FinanceApi {

    String BASE = "/api/v1/finance";

    interface Wallet {
        String BASE = FinanceApi.BASE + "/wallets";
    }

    interface TransactionHistory {
        String BASE = FinanceApi.BASE + "/transactions";
    }

    interface TransactionDetails {
        String BASE = FinanceApi.BASE + "/transaction-details";
    }

    interface Budget {
        String BASE = FinanceApi.BASE + "/budgets";
    }

    interface LoanUser {
        String BASE = FinanceApi.BASE + "/loan-users";
    }

    interface LoanHistory {
        String BASE = FinanceApi.BASE + "/loan-history";
    }

    interface Master {
        String BASE = FinanceApi.BASE + "/master";
    }

    interface Purpose {
        String BASE = FinanceApi.BASE + "/purposes";
        String subcategoriesOf = BASE + "/{purposeId}/subcategories";
    }

    interface Subcategory {
        String BASE = FinanceApi.BASE + "/subcategories";
    }

    interface Ledger {
        String BASE = FinanceApi.BASE + "/ledger";
    }

    interface SharedExpense {
        String BASE = FinanceApi.BASE + "/shared-expenses";
    }

}
