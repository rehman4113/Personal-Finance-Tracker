package com.rehman.finance.auth.service.impl;

import com.rehman.finance.auth.dto.request.ForgotPasswordRequest;
import com.rehman.finance.auth.dto.request.LoginRequest;
import com.rehman.finance.auth.dto.request.RefreshTokenRequest;
import com.rehman.finance.auth.dto.request.RegistrationRequest;
import com.rehman.finance.auth.dto.request.ResendOtpRequest;
import com.rehman.finance.auth.dto.request.ResetPasswordRequest;
import com.rehman.finance.auth.dto.request.UpdateProfileRequest;
import com.rehman.finance.auth.dto.request.VerifyEmailRequest;
import com.rehman.finance.auth.dto.response.ForgotPasswordResponse;
import com.rehman.finance.auth.dto.response.LoginResponse;
import com.rehman.finance.auth.dto.response.LogoutResponse;
import com.rehman.finance.auth.dto.response.RefreshTokenResponse;
import com.rehman.finance.auth.dto.response.RegisterResponse;
import com.rehman.finance.auth.dto.response.DemoCompleteResponse;
import com.rehman.finance.auth.dto.response.ResendOtpResponse;
import com.rehman.finance.auth.dto.response.ResetPasswordResponse;
import com.rehman.finance.auth.dto.response.UserProfileResponse;
import com.rehman.finance.auth.dto.response.VerifyEmailResponse;
import com.rehman.finance.auth.entity.EmailOutbox;
import com.rehman.finance.auth.entity.RefreshToken;
import com.rehman.finance.auth.entity.User;
import com.rehman.finance.auth.enums.AuthErrorCode;
import com.rehman.finance.auth.jwt.JwtService;
import com.rehman.finance.auth.repository.EmailOutboxRepository;
import com.rehman.finance.auth.repository.RefreshTokenRepository;
import com.rehman.finance.auth.repository.UserRepository;
import com.rehman.finance.auth.security.CustomUserDetailsService;
import com.rehman.finance.auth.security.UserPrincipal;
import com.rehman.finance.auth.service.AuthService;
import com.rehman.finance.exception.BusinessException;
import com.rehman.finance.finance.service.WalletService;
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

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    /** OTP validity window — 5 minutes from generation. */
    private static final int OTP_EXPIRY_MINUTES = 5;

    /** Fixed zone for OTP expiry timestamps — generation and validation both
     *  use UTC, so a stored expiry is always comparable regardless of the
     *  server's or requester's local timezone. */
    private static final ZoneId UTC_ZONE = ZoneId.of("UTC");

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final EmailOutboxRepository emailOutboxRepository;
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

        String contact = combineContact(request.getCountryCode(), request.getPhoneNumber());

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .phoneNumber(contact)
                .password(passwordEncoder.encode(request.getPassword()))
                .status("ACTIVE")
                .emailVerified(false)
                .demo(false)
                .build();

        String otp = generateOtp();
        user.setOtp(otp);
        user.setOtpExpiryTime(otpExpiry());

        user = userRepository.save(user);
        log.info("User registered successfully: id={}, email={}", user.getId(), user.getEmail());
        log.info("Email verification OTP generated for user id={}", user.getId());

        emailOutboxRepository.save(EmailOutbox.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .type("REGISTER_VERIFICATION")
                .otpCode(otp)
                .status("PENDING")
                .build());
        log.info("Email verification outbox queued for user id={}", user.getId());

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
                .contact(contact)
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
                    .user(toProfileResponse(user))
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

    @Override
    @Transactional
    public VerifyEmailResponse verifyEmail(VerifyEmailRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BusinessException(AuthErrorCode.USER_NOT_FOUND));

        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new BusinessException(AuthErrorCode.EMAIL_ALREADY_VERIFIED);
        }

        if (user.getOtp() == null || !user.getOtp().equals(request.getOtp())) {
            throw new BusinessException(AuthErrorCode.OTP_INVALID);
        }

        if (user.getOtpExpiryTime() == null || user.getOtpExpiryTime().isBefore(LocalDateTime.now(UTC_ZONE))) {
            throw new BusinessException(AuthErrorCode.OTP_EXPIRED);
        }

        user.setEmailVerified(true);
        user.setOtp(null);
        user.setOtpExpiryTime(null);
        userRepository.save(user);
        log.info("Email verified for user id={}", user.getId());

        return VerifyEmailResponse.builder()
                .message("Email verified successfully")
                .build();
    }

    /**
     * Generates a fresh REGISTER_VERIFICATION OTP for an unverified user and
     * queues it in the outbox (same insert pattern as register()). Replaces
     * the previous code, so an old OTP becomes invalid immediately.
     */
    @Override
    @Transactional
    public ResendOtpResponse resendOtp(ResendOtpRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BusinessException(AuthErrorCode.USER_NOT_FOUND));

        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new BusinessException(AuthErrorCode.EMAIL_ALREADY_VERIFIED);
        }

        String otp = generateOtp();
        user.setOtp(otp);
        user.setOtpExpiryTime(otpExpiry());
        userRepository.save(user);
        log.info("Verification OTP regenerated for user id={}", user.getId());

        emailOutboxRepository.save(EmailOutbox.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .type("REGISTER_VERIFICATION")
                .otpCode(otp)
                .status("PENDING")
                .build());
        log.info("Verification outbox re-queued for user id={}", user.getId());

        return ResendOtpResponse.builder()
                .message("Verification code sent to your email")
                .build();
    }

    /**
     * Marks the demo tour as completed for the authenticated user (one-way
     * flag: once true it stays true — the frontend reads `demo` after login
     * to decide whether to trigger the onboarding tour).
     */
    @Override
    @Transactional
    public DemoCompleteResponse markDemoComplete(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(AuthErrorCode.USER_NOT_FOUND));

        user.setDemo(true);
        userRepository.save(user);
        log.info("Demo tour marked as completed for user id={}", userId);

        return DemoCompleteResponse.builder()
                .message("Demo tour marked as completed")
                .build();
    }

    /**
     * Deliberately reveals whether the email is registered: a reset request for
     * an unknown email fails loudly with USER_NOT_FOUND instead of returning
     * the generic anti-enumeration message (product requirement).
     */
    @Override
    @Transactional
    public ForgotPasswordResponse forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BusinessException(AuthErrorCode.USER_NOT_FOUND));

        String otp = generateOtp();
        user.setOtp(otp);
        user.setOtpExpiryTime(otpExpiry());
        userRepository.save(user);
        log.info("Password reset OTP generated for user id={}", user.getId());

        emailOutboxRepository.save(EmailOutbox.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .type("PASSWORD_RESET")
                .otpCode(otp)
                .status("PENDING")
                .build());
        log.info("Password reset outbox queued for user id={}", user.getId());

        return ForgotPasswordResponse.builder()
                .message("Password reset code sent to your email")
                .build();
    }

    @Override
    @Transactional
    public ResetPasswordResponse resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BusinessException(AuthErrorCode.USER_NOT_FOUND));

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BusinessException(AuthErrorCode.PASSWORD_MISMATCH);
        }

        if (user.getOtp() == null || !user.getOtp().equals(request.getOtp())) {
            throw new BusinessException(AuthErrorCode.OTP_INVALID);
        }

        if (user.getOtpExpiryTime() == null || user.getOtpExpiryTime().isBefore(LocalDateTime.now(UTC_ZONE))) {
            throw new BusinessException(AuthErrorCode.OTP_EXPIRED);
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setOtp(null);
        user.setOtpExpiryTime(null);
        userRepository.save(user);

        refreshTokenRepository.deleteByUser(user);
        log.info("Password reset for user {}, refresh tokens revoked", user.getId());

        return ResetPasswordResponse.builder()
                .message("Password reset successfully")
                .build();
    }

    @Override
    @Transactional
    public UserProfileResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(AuthErrorCode.USER_NOT_FOUND));

        String newEmail = request.getEmail().trim();
        boolean emailChanged = !user.getEmail().equalsIgnoreCase(newEmail);

        if (emailChanged && userRepository.existsByEmail(newEmail)) {
            log.warn("Profile update failed - email already taken: {}", newEmail);
            throw new BusinessException(AuthErrorCode.EMAIL_ALREADY_EXISTS);
        }

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhoneNumber(combineContact(request.getCountryCode(), request.getPhoneNumber()));

        if (emailChanged) {
            // The previous emailVerified flag belonged to the old address, so
            // the new address must go through verification again before it
            // counts as verified.
            user.setEmail(newEmail);
            user.setEmailVerified(false);

            String otp = generateOtp();
            user.setOtp(otp);
            user.setOtpExpiryTime(otpExpiry());

            emailOutboxRepository.save(EmailOutbox.builder()
                    .userId(user.getId())
                    .email(user.getEmail())
                    .type("REGISTER_VERIFICATION")
                    .otpCode(otp)
                    .status("PENDING")
                    .build());
            log.info("Profile email changed for user id={}, new verification OTP queued", user.getId());
        }

        userRepository.save(user);
        log.info("Profile updated for user id={}", user.getId());

        return toProfileResponse(user);
    }

    private UserProfileResponse toProfileResponse(User user) {
        return UserProfileResponse.builder()
                .userId(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .contact(user.getPhoneNumber())
                .status(user.getStatus())
                .emailVerified(user.getEmailVerified())
                .demo(Boolean.TRUE.equals(user.getDemo()))
                .build();
    }

    /** Normalizes a phone fragment to digits only (strips +, spaces, dashes). */
    private String normalizeDigits(String value) {
        return value.replaceAll("[^0-9]", "");
    }

    /** Combines country code and phone number into a single digit string,
     *  e.g. "+92" + "214 342 344" -> "92214342344". */
    private String combineContact(String countryCode, String phoneNumber) {
        return normalizeDigits(countryCode) + normalizeDigits(phoneNumber);
    }

    private String generateOtp() {
        return String.format("%06d", new SecureRandom().nextInt(1_000_000));
    }

    private LocalDateTime otpExpiry() {
        return LocalDateTime.now(UTC_ZONE).plusMinutes(OTP_EXPIRY_MINUTES);
    }
}