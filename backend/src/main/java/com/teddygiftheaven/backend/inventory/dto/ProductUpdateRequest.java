package com.teddygiftheaven.backend.inventory.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// Page 18 (Edit product). No price and no stock here on purpose:
// price -> pricing page (Member 6), stock -> stock adjustment page.
public record ProductUpdateRequest(
        @NotBlank @Size(max = 120) String name,
        @NotNull Integer categoryId,
        String description,
        @Size(max = 255) String imageUrl,
        @NotNull @Min(0) Integer reorderLevel,
        @NotNull Boolean active) {
}
