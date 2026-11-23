package com.teddygiftheaven.backend.audit.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.teddygiftheaven.backend.audit.dto.BackupEntry;
import com.teddygiftheaven.backend.audit.dto.BackupResult;
import com.teddygiftheaven.backend.audit.dto.BackupSummary;
import com.teddygiftheaven.backend.audit.service.BackupService;

// Page 13 (Backup and restore). Owner only: Member 2 adds the OWNER role check to /api/backups/**.
@RestController
@RequestMapping("/api/backups")
public class BackupController {

    private final BackupService service;

    public BackupController(BackupService service) {
        this.service = service;
    }

    @GetMapping
    public List<BackupEntry> history() {
        return service.history();
    }

    @GetMapping("/summary")
    public BackupSummary summary() {
        return service.summary();
    }

    @PostMapping("/run")
    public ResponseEntity<BackupResult> run() {
        BackupResult result = service.runNow();
        return ResponseEntity.status(result.success() ? HttpStatus.OK : HttpStatus.INTERNAL_SERVER_ERROR).body(result);
    }
}
