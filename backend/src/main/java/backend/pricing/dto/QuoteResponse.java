package backend.pricing.dto;

import java.math.BigDecimal;
import java.util.List;

public record QuoteResponse(
        Long productId,
        int quantity,
        BigDecimal unitBasePrice,
        BigDecimal baseSubtotal,
        BigDecimal personalizationSubtotal,
        BigDecimal total,
        List<SelectedPersonalizationResponse> selectedOptions) {
}
