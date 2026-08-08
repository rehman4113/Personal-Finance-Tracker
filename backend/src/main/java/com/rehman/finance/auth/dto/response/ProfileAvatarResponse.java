package com.rehman.finance.auth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One curated avatar option (stable id + asset reference).
 * The frontend renders <img src="…assetPath…">, or the asset path
 * is used directly when the user selects it as their profile avatar.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileAvatarResponse {

    private Long id;
    private String code;
    private String name;
    private String assetPath;
}