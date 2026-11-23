package com.teddygiftheaven.backend.audit.repository;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import com.teddygiftheaven.backend.audit.dto.ActivityItem;
import com.teddygiftheaven.backend.audit.dto.AuditEntry;
import com.teddygiftheaven.backend.audit.dto.AuditSummary;

// Reads v_audit_log and v_activity_feed (V303). Read-only: the audit log can't be changed anyway.
@Repository
public class AuditRepository {

    private final NamedParameterJdbcTemplate jdbc;

    public AuditRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static final RowMapper<AuditEntry> ENTRY = (rs, i) -> new AuditEntry(
            rs.getLong("audit_id"),
            rs.getTimestamp("changed_at").toLocalDateTime(),
            rs.getString("table_name"),
            rs.getString("record_id"),
            rs.getString("action"),
            rs.getString("old_value"),
            rs.getString("new_value"),
            rs.getString("changed_by"),
            rs.getString("role_name"),
            rs.getString("change_type"));

    // builds the WHERE part from whichever filters were given
    private String where(String table, String action, String search, LocalDate from, LocalDate to,
                         MapSqlParameterSource p) {
        List<String> parts = new ArrayList<>();
        if (table != null && !table.isBlank()) { parts.add("table_name = :table"); p.addValue("table", table); }
        if (action != null && !action.isBlank()) { parts.add("action = :action"); p.addValue("action", action); }
        if (search != null && !search.isBlank()) {
            parts.add("(record_id = :search OR changed_by LIKE :like)");
            p.addValue("search", search.trim());
            p.addValue("like", "%" + search.trim() + "%");
        }
        if (from != null) { parts.add("changed_at >= :from"); p.addValue("from", from.atStartOfDay()); }
        if (to != null) { parts.add("changed_at < :to"); p.addValue("to", to.plusDays(1).atStartOfDay()); }
        return parts.isEmpty() ? "" : " WHERE " + String.join(" AND ", parts);
    }

    public List<AuditEntry> find(String table, String action, String search, LocalDate from, LocalDate to,
                                 int page, int size) {
        MapSqlParameterSource p = new MapSqlParameterSource();
        String sql = "SELECT * FROM v_audit_log" + where(table, action, search, from, to, p)
                + " ORDER BY changed_at DESC, audit_id DESC LIMIT :size OFFSET :offset";
        p.addValue("size", size).addValue("offset", page * size);
        return jdbc.query(sql, p, ENTRY);
    }

    public long count(String table, String action, String search, LocalDate from, LocalDate to) {
        MapSqlParameterSource p = new MapSqlParameterSource();
        Long n = jdbc.queryForObject("SELECT COUNT(*) FROM v_audit_log" + where(table, action, search, from, to, p),
                p, Long.class);
        return n == null ? 0 : n;
    }

    public AuditSummary summary() {
        return jdbc.getJdbcTemplate().queryForObject("""
                SELECT
                  SUM(changed_at >= CURRENT_DATE)                                             AS today,
                  SUM(table_name = 'products' AND changed_at >= CURRENT_DATE - INTERVAL 7 DAY) AS prices_week,
                  SUM(table_name = 'stock_movements' AND changed_at >= CURRENT_DATE)          AS stock_today,
                  COUNT(DISTINCT CASE WHEN changed_at >= CURRENT_DATE THEN user_id END)        AS users_today
                FROM audit_log
                """, (rs, i) -> new AuditSummary(rs.getLong("today"), rs.getLong("prices_week"),
                rs.getLong("stock_today"), rs.getLong("users_today")));
    }

    public List<ActivityItem> activity(int limit) {
        return jdbc.query("SELECT * FROM v_activity_feed ORDER BY happened_at DESC LIMIT :limit",
                new MapSqlParameterSource("limit", limit),
                (rs, i) -> new ActivityItem(rs.getTimestamp("happened_at").toLocalDateTime(),
                        rs.getString("source"), rs.getString("activity"), rs.getString("detail"),
                        rs.getString("changed_by")));
    }
}
