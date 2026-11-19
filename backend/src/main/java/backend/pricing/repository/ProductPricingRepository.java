package backend.pricing.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import backend.pricing.model.ProductPricing;

public interface ProductPricingRepository extends JpaRepository<ProductPricing, Long> {

    @EntityGraph(attributePaths = "stockItem")
    List<ProductPricing> findAllByOrderByItemIdAsc();

    @EntityGraph(attributePaths = "stockItem")
    Optional<ProductPricing> findWithStockItemByItemId(Long itemId);
}
