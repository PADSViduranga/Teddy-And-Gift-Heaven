package com.teddygiftheaven.backend.audit.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.teddygiftheaven.backend.audit.dto.ActivityItem;
import com.teddygiftheaven.backend.audit.dto.AuditPage;
import com.teddygiftheaven.backend.audit.dto.AuditSummary;
import com.teddygiftheaven.backend.audit.repository.AuditRepository;

@Service
public class AuditService {

    private static final Set<String> TABLES = Set.of("products", "orders", "payments", "stock_movements", "users");
    private static final Set<String> ACTIONS = Set.of("INSERT", "UPDATE", "DELETE");

    private final AuditRepository repo;

    public AuditService(AuditRepository repo) {
        this.repo = repo;
    }

    public AuditPage search(String table, String action, String search, LocalDate from, LocalDate to, int page, int size) {
        // only accept known filter values, and keep page sizes sensible
        String t = table != null && TABLES.contains(table) ? table : null;
        String a = action != null && ACTIONS.contains(action.toUpperCase()) ? action.toUpperCase() : null;
        int p = Math.max(page, 0);
        int s = Math.min(Math.max(size, 1), 100);
        return new AuditPage(repo.find(t, a, search, from, to, p, s), repo.count(t, a, search, from, to), p, s);
    }

    public AuditSummary summary() {
        return repo.summary();
    }

    public List<ActivityItem> activity(int limit) {
        return repo.activity(Math.min(Math.max(limit, 1), 50));
    }
}
