package com.teddygiftheaven.backend.inventory.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.teddygiftheaven.backend.inventory.dto.AdjustmentRequest;
import com.teddygiftheaven.backend.inventory.dto.CategoryRequest;
import com.teddygiftheaven.backend.inventory.dto.LossRequest;
import com.teddygiftheaven.backend.inventory.dto.PackagingRequest;
import com.teddygiftheaven.backend.inventory.dto.ProductRequest;
import com.teddygiftheaven.backend.inventory.dto.ProductUpdateRequest;
import com.teddygiftheaven.backend.inventory.service.InventoryService;

import jakarta.validation.Valid;

// Member 4 (Inventory), staff pages 17-25.
// Roles (see menus.js): owner and inventory manager everywhere; order staff can view products and
// record losses; packers can record losses and view packaging. Member 2 adds the role checks
// for /api/inventory/** in SecurityConfig.
@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryService service;

    public InventoryController(InventoryService service) {
        this.service = service;
    }

    // stat cards: product count, low stock, out of stock, stock value, active reservations
    @GetMapping("/summary")
    public Map<String, Object> summary() {
        return service.summary();
    }

    // ---------- page 19: categories ----------

    @GetMapping("/categories")
    public List<Map<String, Object>> categories() {
        return service.categories();
    }

    @PostMapping("/categories")
    @ResponseStatus(HttpStatus.CREATED)
    public void addCategory(@Valid @RequestBody CategoryRequest r) {
        service.addCategory(r);
    }

    @PutMapping("/categories/{id}")
    public void renameCategory(@PathVariable int id, @Valid @RequestBody CategoryRequest r) {
        service.renameCategory(id, r);
    }

    @DeleteMapping("/categories/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCategory(@PathVariable int id) {
        service.deleteCategory(id);
    }

    // ---------- pages 17 and 18: products ----------

    // filter = low | out | inactive (optional)
    @GetMapping("/products")
    public List<Map<String, Object>> products(@RequestParam(required = false) String search,
                                              @RequestParam(required = false) Integer categoryId,
                                              @RequestParam(required = false) String filter) {
        return service.products(search, categoryId, filter);
    }

    @GetMapping("/products/{id}")
    public Map<String, Object> product(@PathVariable long id) {
        return service.product(id);
    }

    @PostMapping("/products")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> addProduct(@Valid @RequestBody ProductRequest r) {
        return service.addProduct(r);
    }

    @PutMapping("/products/{id}")
    public Map<String, Object> updateProduct(@PathVariable long id, @Valid @RequestBody ProductUpdateRequest r) {
        return service.updateProduct(id, r);
    }

    // ---------- page 22: packaging materials ----------

    @GetMapping("/packaging")
    public List<Map<String, Object>> packaging() {
        return service.packaging();
    }

    @PostMapping("/packaging")
    @ResponseStatus(HttpStatus.CREATED)
    public void addPackaging(@Valid @RequestBody PackagingRequest r) {
        service.addPackaging(r);
    }

    @PutMapping("/packaging/{id}")
    public void updatePackaging(@PathVariable long id, @Valid @RequestBody PackagingRequest r) {
        service.updatePackaging(id, r);
    }

    // ---------- pages 20 and 21: changing stock ----------

    // every product and packaging item, for the drop-downs
    @GetMapping("/items")
    public List<Map<String, Object>> items() {
        return service.items();
    }

    // owners who can approve a large adjustment
    @GetMapping("/owners")
    public List<Map<String, Object>> owners() {
        return service.owners();
    }

    @PostMapping("/stock/adjust")
    @ResponseStatus(HttpStatus.CREATED)
    public void adjust(@Valid @RequestBody AdjustmentRequest r) {
        service.adjust(r);
    }

    @PostMapping("/stock/losses")
    @ResponseStatus(HttpStatus.CREATED)
    public void recordLoss(@Valid @RequestBody LossRequest r) {
        service.recordLoss(r);
    }

    // page 21 list: damage, loss and returns only
    @GetMapping("/stock/losses")
    public Map<String, Object> losses(@RequestParam(required = false) Long itemId,
                                      @RequestParam(required = false) String type,
                                      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                                      @RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "25") int size) {
        return service.movements(itemId, type, true, from, to, page, size);
    }

    // ---------- page 24: stock movements ----------

    @GetMapping("/stock/movements")
    public Map<String, Object> movements(@RequestParam(required = false) Long itemId,
                                         @RequestParam(required = false) String type,
                                         @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                         @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                                         @RequestParam(defaultValue = "0") int page,
                                         @RequestParam(defaultValue = "25") int size) {
        return service.movements(itemId, type, false, from, to, page, size);
    }

    // ---------- page 23: low-stock alerts ----------

    @GetMapping("/stock/low")
    public List<Map<String, Object>> lowStock() {
        return service.lowStock();
    }

    // ---------- page 25: online reservations ----------

    // status = ACTIVE | CONVERTED | RELEASED | EXPIRED (optional)
    @GetMapping("/stock/reservations")
    public List<Map<String, Object>> reservations(@RequestParam(required = false) String status) {
        return service.reservations(status);
    }
}
