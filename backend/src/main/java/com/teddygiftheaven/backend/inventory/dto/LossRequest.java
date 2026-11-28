package com.teddygiftheaven.backend.inventory.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

// Page 21 (Damaged / lost / returned)
public record LossRequest(
        @NotNull Long itemId,
        @NotNull @Pattern(regexp = "DAMAGE|LOSS|RETURN", message = "must be DAMAGE, LOSS or RETURN") String type,
        @NotNull @Min(1) Integer quantity,
        @NotBlank @Size(max = 255) String reason) {
}
