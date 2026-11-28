package com.teddygiftheaven.backend.reports.controller;

import java.util.Map;
import java.security.Principal;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.teddygiftheaven.backend.reports.service.ReportService;

// Each role may only open its own dashboard.
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

    @GetMapping("/driver")
    public Map<String, Object> driver(Principal principal) {
        return service.driverDashboard(Long.parseLong(principal.getName()));
    }
}
