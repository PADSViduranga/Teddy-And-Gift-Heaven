package com.teddygiftheaven.backend.inventory.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// Page 22 (Packaging materials). openingQty is only used when adding a new material.
public record PackagingRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Size(max = 20) String unit,
        @NotNull @Min(0) Integer reorderLevel,
        @Min(0) Integer openingQty) {
}
