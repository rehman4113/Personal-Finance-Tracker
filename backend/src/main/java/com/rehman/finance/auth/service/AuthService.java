package com.rehman.finance.auth.service;

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
import com.rehman.finance.auth.dto.response.ProfileAvatarResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface AuthService {

    RegisterResponse register(RegistrationRequest request);

    LoginResponse login(LoginRequest request);

    RefreshTokenResponse refreshToken(RefreshTokenRequest request);

    LogoutResponse logout(String refreshToken);

    void validateToken(String token);

    VerifyEmailResponse verifyEmail(VerifyEmailRequest request);

    ResendOtpResponse resendOtp(ResendOtpRequest request);

    ForgotPasswordResponse forgotPassword(ForgotPasswordRequest request);

    ResetPasswordResponse resetPassword(ResetPasswordRequest request);

    UserProfileResponse updateProfile(Long userId, UpdateProfileRequest request);

    DemoCompleteResponse markDemoComplete(Long userId);

    /**
     * The 6 curated avatar options (stable id + asset reference).
     */
    List<ProfileAvatarResponse> getAvatars();

    /**
     * Stores the uploaded profile picture for the user and returns the
     * updated profile (profilePictureUrl now points at the stored file).
     */
    UserProfileResponse uploadProfilePicture(Long userId, MultipartFile file);

    /**
     * Clears the uploaded profile picture (the user falls back to their
     * curated avatar, or initials).
     */
    UserProfileResponse removeProfilePicture(Long userId);
}