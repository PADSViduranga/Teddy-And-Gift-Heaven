package com.teddygiftheaven.backend.audit.dto;

import java.time.LocalDateTime;

// One row of backup_history (V302), as page 13 shows it.
public record BackupEntry(
        long backupId,
        String fileName,
        Long sizeBytes,
        String binlogFile,
        Long binlogPos,
        String method,
        String status,
        LocalDateTime startedAt,
        LocalDateTime finishedAt,
        String note) {
}
