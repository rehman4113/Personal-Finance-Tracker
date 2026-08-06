package com.rehman.finance.auth.repository;

import com.rehman.finance.auth.entity.EmailOutbox;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EmailOutboxRepository extends JpaRepository<EmailOutbox, Long> {

    List<EmailOutbox> findTop20ByStatusOrderByCreatedAtAsc(String status);
}