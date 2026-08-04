package com.rehman.finance.auth.enums;

import com.rehman.finance.exception.ErrorCodeProvider;
import org.springframework.http.HttpStatus;

public enum AuthErrorCode implements ErrorCodeProvider {

    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "AUTH-404-001", "User not found"),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "AUTH-401-001", "Invalid email or password"),
    EMAIL_ALREADY_EXISTS(HttpStatus.CONFLICT, "AUTH-409-001", "Email already registered"),
    REFRESH_TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "AUTH-401-002", "Refresh token has expired"),
    REFRESH_TOKEN_INVALID(HttpStatus.UNAUTHORIZED, "AUTH-401-003", "Invalid refresh token"),
    ACCOUNT_DISABLED(HttpStatus.FORBIDDEN, "AUTH-403-001", "Account is disabled"),
    ACCOUNT_LOCKED(HttpStatus.FORBIDDEN, "AUTH-403-002", "Account is locked"),
    JWT_INVALID(HttpStatus.UNAUTHORIZED, "AUTH-401-004", "Invalid JWT token"),
    JWT_EXPIRED(HttpStatus.UNAUTHORIZED, "AUTH-401-005", "JWT token has expired"),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "AUTH-401-006", "Authentication required"),
    FORBIDDEN(HttpStatus.FORBIDDEN, "AUTH-403-003", "Access denied");

    private final HttpStatus httpStatus;
    private final String code;
    private final String defaultMessage;

    AuthErrorCode(HttpStatus httpStatus, String code, String defaultMessage) {
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