package backend.pricing.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record QuoteRequest(
        @NotNull Long productId,
        @Min(1) int quantity,
        @NotNull @Valid List<SelectedPersonalizationRequest> selectedOptions) {
}
