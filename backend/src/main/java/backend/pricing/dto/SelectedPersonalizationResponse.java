package backend.pricing.dto;

import java.math.BigDecimal;

public record SelectedPersonalizationResponse(
        Integer optionId,
        String name,
        String customText,
        BigDecimal unitExtraCost,
        BigDecimal totalExtraCost) {
}
