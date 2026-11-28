package com.teddygiftheaven.backend.inventory.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// Page 18 (Add product). The price is only set here, when the product is created.
// After that, price changes go through Member 6's pricing page so price_history records them.
public record ProductRequest(
        @NotBlank @Size(max = 120) String name,
        @NotNull Integer categoryId,
        @NotNull @DecimalMin("0.00") BigDecimal price,
        String description,
        @Size(max = 255) String imageUrl,
        @NotNull @Min(0) Integer reorderLevel,
        @NotNull @Min(0) Integer openingQty) {
}
