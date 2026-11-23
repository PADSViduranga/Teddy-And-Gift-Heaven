package com.teddygiftheaven.backend.audit.dto;

import java.time.LocalDateTime;

// One line of the combined activity timeline (audit changes and backups).
public record ActivityItem(LocalDateTime happenedAt, String source, String activity, String detail, String changedBy) {
}
