package com.teddygiftheaven.backend.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// Page 20 (Stock adjustment). qtyDelta is +5 to add five, -3 to remove three.
// approvedBy is the owner's user id, needed when the change is bigger than the approval limit.
public record AdjustmentRequest(
        @NotNull Long itemId,
        @NotNull Integer qtyDelta,
        @NotBlank @Size(max = 255) String reason,
        Long approvedBy) {
}
