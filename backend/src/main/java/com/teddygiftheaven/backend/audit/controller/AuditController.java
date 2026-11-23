package com.teddygiftheaven.backend.audit.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.teddygiftheaven.backend.audit.dto.ActivityItem;
import com.teddygiftheaven.backend.audit.dto.AuditPage;
import com.teddygiftheaven.backend.audit.dto.AuditSummary;
import com.teddygiftheaven.backend.audit.service.AuditService;

// Page 12 (Audit log viewer). Owner only: Member 2 adds the OWNER role check to /api/audit/**.
// Read-only on purpose: there is no endpoint to change or delete audit rows.
@RestController
@RequestMapping("/api/audit")
public class AuditController {

    private final AuditService service;

    public AuditController(AuditService service) {
        this.service = service;
    }

    @GetMapping
    public AuditPage list(@RequestParam(required = false) String table,
                          @RequestParam(required = false) String action,
                          @RequestParam(required = false) String search,
                          @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                          @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                          @RequestParam(defaultValue = "0") int page,
                          @RequestParam(defaultValue = "25") int size) {
        return service.search(table, action, search, from, to, page, size);
    }

    @GetMapping("/summary")
    public AuditSummary summary() {
        return service.summary();
    }

    @GetMapping("/activity")
    public List<ActivityItem> activity(@RequestParam(defaultValue = "10") int limit) {
        return service.activity(limit);
    }
}
