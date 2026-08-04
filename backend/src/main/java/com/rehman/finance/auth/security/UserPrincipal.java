package com.rehman.finance.auth.security;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collections;

@Getter
@Builder
@AllArgsConstructor
public class UserPrincipal implements UserDetails {

    private Long userId;
    private String email;
    private String password;
    private boolean enabled;
    private boolean accountNonLocked;
    private boolean accountNonExpired;
    private boolean credentialsNonExpired;

    public static UserPrincipal create(Long userId, String email, String password) {
        return UserPrincipal.builder()
                .userId(userId)
                .email(email)
                .password(password)
                .enabled(true)
                .accountNonLocked(true)
                .accountNonExpired(true)
                .credentialsNonExpired(true)
                .build();
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public java.util.Collection<? extends org.springframework.security.core.GrantedAuthority> getAuthorities() {
        return Collections.emptyList();
    }
}