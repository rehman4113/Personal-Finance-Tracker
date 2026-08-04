package com.rehman.finance.exception;

import lombok.Getter;

@Getter
public class BusinessException extends RuntimeException {

    private final ErrorCodeProvider errorCode;
    private final transient Object[] args;

    public BusinessException(ErrorCodeProvider errorCode) {
        super(errorCode.getDefaultMessage());
        this.errorCode = errorCode;
        this.args = null;
    }

    public BusinessException(ErrorCodeProvider errorCode, String customMessage) {
        super(customMessage);
        this.errorCode = errorCode;
        this.args = null;
    }

    public BusinessException(ErrorCodeProvider errorCode, Object... args) {
        super(errorCode.getDefaultMessage());
        this.errorCode = errorCode;
        this.args = args;
    }

}
