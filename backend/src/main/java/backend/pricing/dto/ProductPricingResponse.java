package backend.pricing.dto;

import java.math.BigDecimal;
import java.util.List;

import backend.pricing.model.ProductPricing;

public record ProductPricingResponse(
        Long productId,
        String name,
        BigDecimal basePrice,
        String description,
        boolean active,
        List<PersonalizationOptionResponse> personalizationOptions) {

    public static ProductPricingResponse from(ProductPricing product,
            List<PersonalizationOptionResponse> options) {
        return new ProductPricingResponse(
                product.getItemId(),
                product.getStockItem().getName(),
                product.getPrice(),
                product.getDescription(),
                product.isActive(),
                options);
    }
}
