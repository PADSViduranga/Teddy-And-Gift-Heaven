package com.teddygiftheaven.backend.inventory.controller;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.teddygiftheaven.backend.inventory.service.InventoryService;

// Member 4: the customer shop pages (/shop and /product/:id). Read-only.
// Customers never see exact stock counts, only "in stock" and "only N left".
@RestController
@RequestMapping("/api/shop")
public class ShopController {

    private final InventoryService service;

    public ShopController(InventoryService service) {
        this.service = service;
    }

    @GetMapping("/categories")
    public List<Map<String, Object>> categories() {
        return service.categories();
    }

    // sort = price_asc | price_desc (optional; default shows in-stock items first, A to Z)
    @GetMapping("/products")
    public List<Map<String, Object>> products(@RequestParam(required = false) String search,
                                              @RequestParam(required = false) Integer categoryId,
                                              @RequestParam(required = false) String sort) {
        return service.shopProducts(search, categoryId, sort);
    }

    @GetMapping("/products/{id}")
    public Map<String, Object> product(@PathVariable long id) {
        return service.shopProduct(id);
    }
}
