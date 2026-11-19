package backend.pricing.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "stock_items")
public class StockItemReference {

    @Id
    @Column(name = "item_id")
    private Long itemId;

    @Column(nullable = false, length = 120)
    private String name;

    protected StockItemReference() {
    }

    public Long getItemId() {
        return itemId;
    }

    public String getName() {
        return name;
    }
}
