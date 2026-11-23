package com.teddygiftheaven.backend.audit.dto;

import java.time.LocalDateTime;

// One row of the audit log, as page 12 shows it.
public record AuditEntry(
        long auditId,
        LocalDateTime changedAt,
        String tableName,
        String recordId,
        String action,
        String oldValue,
        String newValue,
        String changedBy,
        String roleName,
        String changeType) {
}
