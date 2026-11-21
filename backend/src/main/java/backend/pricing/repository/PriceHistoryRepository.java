package backend.pricing.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import backend.pricing.model.PriceHistory;

public interface PriceHistoryRepository extends JpaRepository<PriceHistory, Long> {
}
