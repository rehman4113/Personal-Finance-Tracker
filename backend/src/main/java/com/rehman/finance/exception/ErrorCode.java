package com.rehman.finance.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode implements ErrorCodeProvider {

    // === Global Errors ===
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "GLOBAL-500-001", "An unexpected error occurred"),
    BAD_REQUEST(HttpStatus.BAD_REQUEST, "GLOBAL-400-001", "Invalid request"),
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "GLOBAL-400-002", "Validation failed"),
    RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND, "GLOBAL-404-001", "Resource not found"),
    ACCESS_DENIED(HttpStatus.FORBIDDEN, "GLOBAL-403-001", "Access denied"),
    DUPLICATE_RESOURCE(HttpStatus.CONFLICT, "GLOBAL-409-001", "Resource already exists"),
    MISSING_HEADER(HttpStatus.BAD_REQUEST, "GLOBAL-400-003", "Required header is missing"),

    // === Finance Errors ===
    WALLET_NOT_FOUND(HttpStatus.NOT_FOUND, "FIN-404-001", "Wallet not found"),
    WALLET_NOT_DELETABLE(HttpStatus.BAD_REQUEST, "FIN-400-003", "System wallet cannot be deleted"),
    WALLET_TYPE_NOT_FOUND(HttpStatus.NOT_FOUND, "FIN-404-002", "Wallet type not found"),
    WALLET_TYPE_NOT_DELETABLE(HttpStatus.BAD_REQUEST, "FIN-400-001", "Cannot delete system default wallet type"),
    WALLET_TYPE_NOT_MODIFIABLE(HttpStatus.BAD_REQUEST, "FIN-400-002", "Cannot modify system default wallet type"),
    WALLET_TYPE_CODE_EXISTS(HttpStatus.CONFLICT, "FIN-409-001", "Wallet type code already exists"),
    DUPLICATE_WALLET(HttpStatus.CONFLICT, "FIN-409-002", "Wallet already exists with same type and account number"),

    TRANSACTION_NOT_FOUND(HttpStatus.NOT_FOUND, "FIN-404-010", "Transaction not found"),
    INVALID_AMOUNT(HttpStatus.BAD_REQUEST, "FIN-400-010", "Invalid amount"),
    INSUFFICIENT_BALANCE(HttpStatus.BAD_REQUEST, "FIN-400-011", "Insufficient wallet balance"),
    INVALID_TRANSACTION(HttpStatus.BAD_REQUEST, "FIN-400-012", "Invalid transaction"),
    TRANSACTION_PURPOSE_NOT_FOUND(HttpStatus.NOT_FOUND, "FIN-404-011", "Transaction purpose not found"),
    PURPOSE_NOT_DELETABLE(HttpStatus.BAD_REQUEST, "FIN-400-015", "Cannot delete system transaction purpose"),
    PURPOSE_CODE_EXISTS(HttpStatus.CONFLICT, "FIN-409-011", "Transaction purpose code already exists"),
    SUBCATEGORY_NOT_FOUND(HttpStatus.NOT_FOUND, "FIN-404-012", "Transaction subcategory not found"),
    SUBCATEGORY_NOT_DELETABLE(HttpStatus.BAD_REQUEST, "FIN-400-016", "Cannot delete system subcategory"),
    SUBCATEGORY_CODE_EXISTS(HttpStatus.CONFLICT, "FIN-409-012", "Transaction subcategory code already exists"),

    BUDGET_NOT_FOUND(HttpStatus.NOT_FOUND, "FIN-404-020", "Budget limit not found"),
    DUPLICATE_BUDGET(HttpStatus.CONFLICT, "FIN-409-020", "Budget limit already exists for this purpose and month"),

    LOAN_NOT_FOUND(HttpStatus.NOT_FOUND, "FIN-404-030", "Loan not found"),
    LOAN_USER_NOT_FOUND(HttpStatus.NOT_FOUND, "FIN-404-031", "Loan user not found"),
    DUPLICATE_LOAN(HttpStatus.CONFLICT, "FIN-409-030", "Loan already exists with same counterparty and type"),
    LOAN_INSTALLMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "FIN-404-032", "Loan installment not found"),
    INSTALLMENT_ALREADY_PAID(HttpStatus.BAD_REQUEST, "FIN-400-030", "Installment already paid"),

    LEDGER_ENTRY_NOT_FOUND(HttpStatus.NOT_FOUND, "FIN-404-040", "Ledger entry not found"),

    SHARED_EXPENSE_NOT_FOUND(HttpStatus.NOT_FOUND, "FIN-404-050", "Shared expense not found"),
    MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND, "FIN-404-051", "Shared expense member not found"),

    MASTER_DATA_NOT_FOUND(HttpStatus.NOT_FOUND, "FIN-404-060", "Master data not found");

    private final HttpStatus httpStatus;
    private final String code;
    private final String defaultMessage;

    ErrorCode(HttpStatus httpStatus, String code, String defaultMessage) {
        this.httpStatus = httpStatus;
        this.code = code;
        this.defaultMessage = defaultMessage;
    }

    public HttpStatus getHttpStatus() {
        return httpStatus;
    }

    public String getCode() {
        return code;
    }

    public String getDefaultMessage() {
        return defaultMessage;
    }

}
