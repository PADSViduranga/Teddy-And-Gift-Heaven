package com.teddygiftheaven.backend.reports.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.teddygiftheaven.backend.reports.service.ReportService;

// Report pages 63-68 (Member 10). Owner only, except stock-loss (owner and inventory manager).
// Member 2 adds the role checks to /api/reports/**.
@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService service;

    public ReportController(ReportService service) {
        this.service = service;
    }

    @GetMapping("/sales/daily")
    public List<Map<String, Object>> salesDaily(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        LocalDate end = to != null ? to : LocalDate.now();
        LocalDate start = from != null ? from : end.minusDays(29);
        return service.salesDaily(start, end);
    }

    @GetMapping("/sales/monthly")
    public List<Map<String, Object>> salesMonthly() { return service.salesMonthly(); }

    @GetMapping("/products")
    public List<Map<String, Object>> products() { return service.products(); }

    @GetMapping("/categories")
    public List<Map<String, Object>> categories() { return service.categories(); }

    @GetMapping("/seasonal")
    public List<Map<String, Object>> seasonal() { return service.seasonal(); }

    @GetMapping("/customers")
    public List<Map<String, Object>> customers(@RequestParam(defaultValue = "50") int limit) {
        return service.customers(Math.min(Math.max(limit, 1), 500));
    }

    @GetMapping("/customers/summary")
    public Map<String, Object> customerSummary() { return service.customerSummary(); }

    @GetMapping("/stock-loss")
    public List<Map<String, Object>> stockLoss() { return service.stockLoss(); }

    @GetMapping("/payments")
    public List<Map<String, Object>> payments(@RequestParam(defaultValue = "12") int months) {
        return service.payments(Math.min(Math.max(months, 1), 36));
    }

    @GetMapping("/drivers")
    public List<Map<String, Object>> drivers() { return service.drivers(); }

    @GetMapping("/stock-flow")
    public List<Map<String, Object>> stockFlow() { return service.stockFlow(); }
}
