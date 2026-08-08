package com.rehman.finance.finance.dto.request;

import java.time.LocalDateTime;

/**
 * Optional filters for the server-side transaction list. Every field is nullable;
 * null means "no filter". {@code from}/{@code to} are exclusive-bound normalized
 * timestamps computed by the controller ({@code from} at start-of-day, {@code to}
 * at start-of-next-day).
 */
public record TransactionFilter(
        String type,
        String status,
        String purpose,
        String subcategory,
        LocalDateTime from,
        LocalDateTime to,
        Long walletId,
        String search) {
}
