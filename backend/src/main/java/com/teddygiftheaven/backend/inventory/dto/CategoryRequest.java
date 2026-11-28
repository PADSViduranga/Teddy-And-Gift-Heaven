package com.teddygiftheaven.backend.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// Page 19 (Categories)
public record CategoryRequest(@NotBlank @Size(max = 80) String name) {
}
