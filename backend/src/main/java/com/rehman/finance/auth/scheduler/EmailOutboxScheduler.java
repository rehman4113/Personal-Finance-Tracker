package com.rehman.finance.auth.scheduler;

import com.rehman.finance.auth.entity.EmailOutbox;
import com.rehman.finance.auth.repository.EmailOutboxRepository;
import com.rehman.finance.auth.service.EmailSenderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Polls the email outbox and sends pending OTP emails via SMTP.
 * PENDING rows are claimed in batches of 20 (oldest first) so a
 * single failure never blocks the rest of the batch. The OTP code
 * is never logged.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EmailOutboxScheduler {

    private static final int MAX_ATTEMPTS = 5;

    private final EmailOutboxRepository emailOutboxRepository;
    private final EmailSenderService emailSenderService;

    @Scheduled(fixedDelay = 15000)
    @Transactional
    public void processPendingEmails() {
        List<EmailOutbox> batch = emailOutboxRepository.findTop20ByStatusOrderByCreatedAtAsc("PENDING");
        for (EmailOutbox item : batch) {
            item.setStatus("PROCESSING");
            emailOutboxRepository.save(item);
            try {
                emailSenderService.sendOtpEmail(item.getEmail(), item.getOtpCode(), item.getType());
                item.setStatus("SENT");
                item.setSentAt(LocalDateTime.now());
            } catch (Exception e) {
                item.setAttemptCount(item.getAttemptCount() + 1);
                item.setLastError(truncate(e.getMessage()));
                item.setStatus(item.getAttemptCount() >= MAX_ATTEMPTS ? "FAILED" : "PENDING");
                log.warn("Failed to send outbox email id={}, attempt={}: {}", item.getId(), item.getAttemptCount(), e.getMessage());
            }
            emailOutboxRepository.save(item);
        }
    }

    private String truncate(String message) {
        if (message == null) {
            return null;
        }
        return message.length() > 500 ? message.substring(0, 500) : message;
    }
}