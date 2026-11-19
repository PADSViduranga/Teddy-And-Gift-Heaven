package backend.pricing.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreatePersonalizationOptionRequest(
        @NotBlank @Size(max = 80) String name,
        @NotNull @DecimalMin("0.00") BigDecimal extraCost,
        @NotNull @Min(0) Integer extraMinutes) {
}
