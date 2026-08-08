package com.rehman.finance.auth.repository;

import com.rehman.finance.auth.entity.ProfileAvatar;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProfileAvatarRepository extends JpaRepository<ProfileAvatar, Long> {

    List<ProfileAvatar> findAllByOrderByIdAsc();
}