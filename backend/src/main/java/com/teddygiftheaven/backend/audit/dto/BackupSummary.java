package com.teddygiftheaven.backend.audit.dto;

import java.time.LocalDateTime;

// The health banner and stat cards on page 13.
public record BackupSummary(
        long total,
        long failed,
        LocalDateTime lastSuccess,
        Long hoursSinceLastSuccess,
        long keptCount,
        long keptBytes) {
}
