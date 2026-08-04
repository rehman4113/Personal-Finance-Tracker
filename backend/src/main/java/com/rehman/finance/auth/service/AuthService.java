package com.rehman.finance.auth.service;

import com.rehman.finance.auth.dto.request.LoginRequest;
import com.rehman.finance.auth.dto.request.RefreshTokenRequest;
import com.rehman.finance.auth.dto.request.RegistrationRequest;
import com.rehman.finance.auth.dto.response.LoginResponse;
import com.rehman.finance.auth.dto.response.LogoutResponse;
import com.rehman.finance.auth.dto.response.RefreshTokenResponse;
import com.rehman.finance.auth.dto.response.RegisterResponse;

public interface AuthService {

    RegisterResponse register(RegistrationRequest request);

    LoginResponse login(LoginRequest request);

    RefreshTokenResponse refreshToken(RefreshTokenRequest request);

    LogoutResponse logout(String refreshToken);

    void validateToken(String token);
}