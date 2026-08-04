package com.rehman.finance.auth.service.impl;

import com.rehman.finance.auth.dto.request.LoginRequest;
import com.rehman.finance.auth.dto.request.RefreshTokenRequest;
import com.rehman.finance.auth.dto.request.RegistrationRequest;
import com.rehman.finance.auth.dto.response.LoginResponse;
import com.rehman.finance.auth.dto.response.LogoutResponse;
import com.rehman.finance.auth.dto.response.RefreshTokenResponse;
import com.rehman.finance.auth.dto.response.RegisterResponse;
import com.rehman.finance.auth.dto.response.UserProfileResponse;
import com.rehman.finance.auth.entity.RefreshToken;
import com.rehman.finance.auth.entity.User;
import com.rehman.finance.auth.enums.AuthErrorCode;
import com.rehman.finance.auth.jwt.JwtService;
import com.rehman.finance.auth.repository.RefreshTokenRepository;
import com.rehman.finance.auth.repository.UserRepository;
import com.rehman.finance.finance.service.WalletService;
import com.rehman.finance.auth.security.CustomUserDetailsService;
import com.rehman.finance.auth.security.UserPrincipal;
import com.rehman.finance.auth.service.AuthService;
import com.rehman.finance.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final CustomUserDetailsService customUserDetailsService;
    private final WalletService walletService;

    @Override
    @Transactional
    public RegisterResponse register(RegistrationRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("Registration failed - email already exists: {}", request.getEmail());
            throw new BusinessException(AuthErrorCode.EMAIL_ALREADY_EXISTS);
        }

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .status("ACTIVE")
                .emailVerified(false)
                .build();

        user = userRepository.save(user);
        log.info("User registered successfully: id={}, email={}", user.getId(), user.getEmail());

        try {
            walletService.createSystemWallet(user.getId());
            log.info("System wallet created for new user id={}", user.getId());
        } catch (RuntimeException e) {
            log.warn("Could not create system wallet for user id={}: {}", user.getId(), e.getMessage());
        }

        return RegisterResponse.builder()
                .userId(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .message("Registration successful")
                .build();
    }

    @Override
    @Transactional
    public LoginResponse login(LoginRequest request) {
        try {
            var authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
            User user = userRepository.findById(userPrincipal.getUserId())
                    .orElseThrow(() -> new BusinessException(AuthErrorCode.USER_NOT_FOUND));

            if (!"ACTIVE".equals(user.getStatus())) {
                throw new BusinessException(AuthErrorCode.ACCOUNT_DISABLED);
            }

            String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail());
            String refreshTokenStr = jwtService.generateRefreshToken(user.getId(), user.getEmail());

            RefreshToken refreshToken = RefreshToken.builder()
                    .user(user)
                    .token(refreshTokenStr)
                    .expiryDate(LocalDateTime.now().plusDays(7))
                    .revoked(false)
                    .build();
            refreshTokenRepository.save(refreshToken);

            log.info("User logged in: id={}, email={}", user.getId(), user.getEmail());

            return LoginResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshTokenStr)
                    .tokenType("Bearer")
                    .expiresIn(jwtService.getAccessTokenExpiration() / 1000)
                    .user(UserProfileResponse.builder()
                            .userId(user.getId())
                            .firstName(user.getFirstName())
                            .lastName(user.getLastName())
                            .email(user.getEmail())
                            .status(user.getStatus())
                            .emailVerified(user.getEmailVerified())
                            .build())
                    .build();

        } catch (BadCredentialsException e) {
            log.warn("Login failed - invalid credentials for email: {}", request.getEmail());
            throw new BusinessException(AuthErrorCode.INVALID_CREDENTIALS);
        } catch (DisabledException e) {
            log.warn("Login failed - account disabled: {}", request.getEmail());
            throw new BusinessException(AuthErrorCode.ACCOUNT_DISABLED);
        } catch (LockedException e) {
            log.warn("Login failed - account locked: {}", request.getEmail());
            throw new BusinessException(AuthErrorCode.ACCOUNT_LOCKED);
        }
    }

    @Override
    @Transactional
    public RefreshTokenResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken storedToken = refreshTokenRepository.findByTokenAndRevokedFalse(request.getRefreshToken())
                .orElseThrow(() -> {
                    log.warn("Refresh token invalid or revoked");
                    return new BusinessException(AuthErrorCode.REFRESH_TOKEN_INVALID);
                });

        if (storedToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            storedToken.setRevoked(true);
            refreshTokenRepository.save(storedToken);
            log.warn("Refresh token expired for user id={}", storedToken.getUser().getId());
            throw new BusinessException(AuthErrorCode.REFRESH_TOKEN_EXPIRED);
        }
        User user = storedToken.getUser();
        String newAccessToken = jwtService.generateAccessToken(user.getId(), user.getEmail());
        String newRefreshTokenStr = jwtService.generateRefreshToken(user.getId(), user.getEmail());

        storedToken.setRevoked(true);
        refreshTokenRepository.save(storedToken);

        RefreshToken newRefreshToken = RefreshToken.builder()
                .user(user)
                .token(newRefreshTokenStr)
                .expiryDate(LocalDateTime.now().plusDays(7))
                .revoked(false)
                .build();
        refreshTokenRepository.save(newRefreshToken);

        log.info("Token refreshed for user id={}", user.getId());

        return RefreshTokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshTokenStr)
                .tokenType("Bearer")
                .expiresIn(jwtService.getAccessTokenExpiration() / 1000)
                .build();
    }

    @Override
    @Transactional
    public LogoutResponse logout(String refreshToken) {
        RefreshToken storedToken = refreshTokenRepository.findByToken(refreshToken)
                .orElse(null);

        if (storedToken != null) {
            storedToken.setRevoked(true);
            refreshTokenRepository.save(storedToken);
            log.info("User logged out: id={}", storedToken.getUser().getId());
        }

        return LogoutResponse.builder()
                .message("Logout successful")
                .build();
    }

    @Override
    public void validateToken(String token) {
        if (!jwtService.validateToken(token)) {
            throw new BusinessException(AuthErrorCode.JWT_INVALID);
        }
    }
}