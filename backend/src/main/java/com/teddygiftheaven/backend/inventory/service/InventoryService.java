package com.teddygiftheaven.backend.inventory.service;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.teddygiftheaven.backend.inventory.dto.AdjustmentRequest;
import com.teddygiftheaven.backend.inventory.dto.CategoryRequest;
import com.teddygiftheaven.backend.inventory.dto.LossRequest;
import com.teddygiftheaven.backend.inventory.dto.PackagingRequest;
import com.teddygiftheaven.backend.inventory.dto.ProductRequest;
import com.teddygiftheaven.backend.inventory.dto.ProductUpdateRequest;
import com.teddygiftheaven.backend.inventory.repository.InventoryRepository;

// Member 4 (Inventory). Thin layer between the controllers and the repository:
// it cleans up filter values, works out who is logged in, and reports "not found".
@Service
public class InventoryService {

    private static final Set<String> PRODUCT_FILTERS = Set.of("low", "out", "inactive");
    private static final Set<String> MOVEMENT_TYPES =
            Set.of("SALE", "RESERVE", "RELEASE", "RECEIPT", "DAMAGE", "LOSS", "RETURN", "ADJUSTMENT");
    private static final List<String> LOSS_TYPES = List.of("DAMAGE", "LOSS", "RETURN");
    private static final Set<String> RESERVATION_STATUSES = Set.of("ACTIVE", "CONVERTED", "RELEASED", "EXPIRED");

    private final InventoryRepository repo;

    public InventoryService(InventoryRepository repo) {
        this.repo = repo;
    }

    // The JWT subject identifies the actor for stock changes.
    private Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return Long.valueOf(auth.getName());
    }

    // ---------- overview ----------

    public Map<String, Object> summary() {
        Map<String, Object> s = new LinkedHashMap<>(repo.summary());
        s.put("approval_limit", repo.approvalLimit());
        return s;
    }

    // ---------- categories ----------

    public List<Map<String, Object>> categories() {
        return repo.categories();
    }

    public void addCategory(CategoryRequest r) {
        repo.addCategory(r.name());
    }

    public void renameCategory(int id, CategoryRequest r) {
        if (repo.renameCategory(id, r.name()) == 0) throw new InventoryNotFoundException("Category not found");
    }

    public void deleteCategory(int id) {
        if (repo.deleteCategory(id) == 0) throw new InventoryNotFoundException("Category not found");
    }

    // ---------- products ----------

    public List<Map<String, Object>> products(String search, Integer categoryId, String filter) {
        String f = filter != null && PRODUCT_FILTERS.contains(filter) ? filter : null;
        return repo.products(search, categoryId, f);
    }

    public Map<String, Object> product(long id) {
        Map<String, Object> p = repo.product(id);
        if (p == null) throw new InventoryNotFoundException("Product not found");
        return p;
    }

    public Map<String, Object> addProduct(ProductRequest r) {
        long id = repo.addProduct(r, currentUserId());
        return product(id);
    }

    @Transactional
    public Map<String, Object> updateProduct(long id, ProductUpdateRequest r) {
        if (repo.updateProduct(id, r) == 0) throw new InventoryNotFoundException("Product not found");
        return product(id);
    }

    // ---------- packaging ----------

    public List<Map<String, Object>> packaging() {
        return repo.packaging();
    }

    public void addPackaging(PackagingRequest r) {
        repo.addPackaging(r, currentUserId());
    }

    @Transactional
    public void updatePackaging(long id, PackagingRequest r) {
        if (repo.updatePackaging(id, r) == 0) throw new InventoryNotFoundException("Packaging item not found");
    }

    // ---------- stock changes ----------

    public List<Map<String, Object>> items() {
        return repo.items();
    }

    public List<Map<String, Object>> owners() {
        return repo.owners();
    }

    public void adjust(AdjustmentRequest r) {
        repo.adjust(r, currentUserId());
    }

    public void recordLoss(LossRequest r) {
        repo.recordLoss(r, currentUserId());
    }

    // ---------- history, low stock, reservations ----------

    // page 24: all movements; page 21 passes losses=true to see only damage, loss and returns
    public Map<String, Object> movements(Long itemId, String type, boolean losses, LocalDate from, LocalDate to,
                                         int page, int size) {
        List<String> types;
        if (losses) {
            types = type != null && LOSS_TYPES.contains(type) ? List.of(type) : LOSS_TYPES;
        } else {
            types = type != null && MOVEMENT_TYPES.contains(type) ? List.of(type) : null;
        }
        int p = Math.max(page, 0);
        int s = Math.min(Math.max(size, 1), 100);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("items", repo.movements(itemId, types, from, to, p, s));
        result.put("total", repo.countMovements(itemId, types, from, to));
        result.put("page", p);
        result.put("size", s);
        return result;
    }

    public List<Map<String, Object>> lowStock() {
        return repo.lowStock();
    }

    public List<Map<String, Object>> reservations(String status) {
        String s = status != null && RESERVATION_STATUSES.contains(status) ? status : null;
        return repo.reservations(s);
    }

    // ---------- customer shop ----------

    public List<Map<String, Object>> shopProducts(String search, Integer categoryId, String sort) {
        return repo.shopProducts(search, categoryId, sort);
    }

    public Map<String, Object> shopProduct(long id) {
        Map<String, Object> p = repo.shopProduct(id);
        if (p == null) throw new InventoryNotFoundException("Product not found");
        return p;
    }
}
