package com.teddygiftheaven.backend.audit.repository;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.teddygiftheaven.backend.audit.dto.BackupEntry;
import com.teddygiftheaven.backend.audit.dto.BackupSummary;

// Reads backup_history (V302). Rows are written by database/backup/backup.sh, not by the app.
@Repository
public class BackupRepository {

    private final JdbcTemplate jdbc;

    public BackupRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static LocalDateTime time(Timestamp t) {
        return t == null ? null : t.toLocalDateTime();
    }

    public List<BackupEntry> latest(int limit) {
        return jdbc.query("SELECT * FROM backup_history ORDER BY started_at DESC, backup_id DESC LIMIT ?",
                (rs, i) -> new BackupEntry(
                        rs.getLong("backup_id"),
                        rs.getString("file_name"),
                        rs.getObject("size_bytes", Long.class),
                        rs.getString("binlog_file"),
                        rs.getObject("binlog_pos", Long.class),
                        rs.getString("method"),
                        rs.getString("status"),
                        time(rs.getTimestamp("started_at")),
                        time(rs.getTimestamp("finished_at")),
                        rs.getString("note")),
                limit);
    }

    public BackupSummary summary() {
        return jdbc.queryForObject("""
                SELECT COUNT(*)                                                         AS total,
                       COALESCE(SUM(status = 'FAILED'), 0)                              AS failed,
                       MAX(CASE WHEN status = 'SUCCESS' THEN finished_at END)           AS last_success,
                       TIMESTAMPDIFF(HOUR, MAX(CASE WHEN status = 'SUCCESS' THEN finished_at END), NOW()) AS hours_ago,
                       COALESCE(SUM(status = 'SUCCESS' AND finished_at >= NOW() - INTERVAL 14 DAY), 0) AS kept_count,
                       COALESCE(SUM(CASE WHEN status = 'SUCCESS' AND finished_at >= NOW() - INTERVAL 14 DAY
                                         THEN size_bytes END), 0)                       AS kept_bytes
                FROM backup_history
                """,
                (rs, i) -> new BackupSummary(
                        rs.getLong("total"),
                        rs.getLong("failed"),
                        time(rs.getTimestamp("last_success")),
                        rs.getObject("hours_ago", Long.class),
                        rs.getLong("kept_count"),
                        rs.getLong("kept_bytes")));
    }
}
