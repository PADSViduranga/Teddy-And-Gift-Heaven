package com.teddygiftheaven.backend.reports.controller;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.teddygiftheaven.backend.reports.service.ReportService;

// Dashboards, pages 58-62 (Member 10). Each role may only open its own dashboard: Member 2 adds the checks.
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final ReportService service;

    public DashboardController(ReportService service) {
        this.service = service;
    }

    @GetMapping("/owner")
    public Map<String, Object> owner() { return service.ownerDashboard(); }

    @GetMapping("/order-staff")
    public Map<String, Object> orderStaff() { return service.orderStaffDashboard(); }

    @GetMapping("/inventory")
    public Map<String, Object> inventory() { return service.inventoryDashboard(); }

    @GetMapping("/packer")
    public Map<String, Object> packer() { return service.packerDashboard(); }

    // TEMPORARY: driverId as a parameter until the logged-in driver comes from Member 2's JWT
    @GetMapping("/driver")
    public Map<String, Object> driver(@RequestParam long driverId) { return service.driverDashboard(driverId); }
}
