package com.rehman.finance.auth.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Curated profile avatar catalog (exactly 6 rows, seeded by V5).
 * WHY: the picker offers stable ids + asset references instead of
 * free-form Bootstrap Icons names, so the avatar renders consistently
 * everywhere the profile is shown.
 */
@Entity
@Table(name = "pf_profile_avatars")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileAvatar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 32)
    private String code;

    @Column(nullable = false, length = 60)
    private String name;

    @Column(name = "asset_path", nullable = false, length = 255)
    private String assetPath;
}