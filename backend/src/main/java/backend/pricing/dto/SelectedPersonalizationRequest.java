package backend.pricing.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SelectedPersonalizationRequest(
        @NotNull Integer optionId,
        @Size(max = 255) String customText) {
}
