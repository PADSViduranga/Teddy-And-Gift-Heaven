package com.teddygiftheaven.backend.audit.dto;

// The four numbers on the stat cards at the top of page 12.
public record AuditSummary(long changesToday, long priceChangesThisWeek, long stockChangesToday, long activeUsersToday) {
}
