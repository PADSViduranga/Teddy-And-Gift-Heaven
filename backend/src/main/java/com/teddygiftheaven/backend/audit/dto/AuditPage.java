package com.teddygiftheaven.backend.audit.dto;

import java.util.List;

// One page of results plus the total, so the page can show "1–25 of 312".
public record AuditPage(List<AuditEntry> items, long total, int page, int size) {
}
