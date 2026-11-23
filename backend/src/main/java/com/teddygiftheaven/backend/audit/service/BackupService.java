package com.teddygiftheaven.backend.audit.service;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.teddygiftheaven.backend.audit.dto.BackupEntry;
import com.teddygiftheaven.backend.audit.dto.BackupResult;
import com.teddygiftheaven.backend.audit.dto.BackupSummary;
import com.teddygiftheaven.backend.audit.repository.BackupRepository;

// Page 13. "Back up now" runs the same database/backup/backup.sh as the nightly schedule,
// so there is only one way a backup is made. Restoring is deliberately not offered over the web.
@Service
public class BackupService {

    private final BackupRepository repo;
    private final String script;
    private final AtomicBoolean running = new AtomicBoolean(false);

    public BackupService(BackupRepository repo,
                         @Value("${app.backup.script:../database/backup/backup.sh}") String script) {
        this.repo = repo;
        this.script = script;
    }

    public List<BackupEntry> history() {
        return repo.latest(50);
    }

    public BackupSummary summary() {
        return repo.summary();
    }

    public BackupResult runNow() {
        File file = new File(script);
        if (!file.canExecute()) {
            return new BackupResult(false, "Backup script not found or not executable: " + file.getAbsolutePath());
        }
        // only one backup at a time, even if the button is clicked twice
        if (!running.compareAndSet(false, true)) {
            return new BackupResult(false, "A backup is already running. Wait for it to finish.");
        }
        try {
            Process p = new ProcessBuilder("bash", file.getAbsolutePath(), "MANUAL")
                    .redirectErrorStream(true)
                    .start();
            String last = "";
            try (BufferedReader out = new BufferedReader(new InputStreamReader(p.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = out.readLine()) != null) {
                    if (!line.isBlank()) last = line.trim();
                }
            }
            if (!p.waitFor(5, TimeUnit.MINUTES)) {
                p.destroyForcibly();
                return new BackupResult(false, "The backup took longer than 5 minutes and was stopped.");
            }
            boolean ok = p.exitValue() == 0;
            return new BackupResult(ok, ok ? "Backup finished. " + last : "Backup failed. " + last);
        } catch (Exception e) {
            return new BackupResult(false, "The backup couldn't be started: " + e.getMessage());
        } finally {
            running.set(false);
        }
    }
}
