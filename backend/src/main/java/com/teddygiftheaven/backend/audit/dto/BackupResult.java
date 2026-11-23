package com.teddygiftheaven.backend.audit.dto;

// What "Back up now" returns: whether it worked, and the script's last line.
public record BackupResult(boolean success, String message) {
}
