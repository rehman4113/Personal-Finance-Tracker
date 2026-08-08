package com.rehman.finance.auth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {

    private Long userId;
    private String firstName;
    private String lastName;
    private String email;
    private String contact;
    private String status;
    private boolean emailVerified;
    private boolean demo;
/** Curated avatar id (1..6) — null when the user has no curated avatar. */
    private Long profileIconId;
    /** Uploaded profile picture URL — null when the user has no photo. */
    private String profilePictureUrl;
}