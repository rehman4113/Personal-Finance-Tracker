package com.rehman.finance.exception;

import org.springframework.http.HttpStatus;

public interface ErrorCodeProvider {
    HttpStatus getHttpStatus();
    String getCode();
    String getDefaultMessage();
}