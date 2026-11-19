package backend.pricing.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public record UpdatePriceRequest(
        @NotNull @DecimalMin("0.00") BigDecimal basePrice) {
}
