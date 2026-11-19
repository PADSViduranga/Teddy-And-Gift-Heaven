package backend.pricing.model;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "personalization_options")
public class PersonalizationOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "option_id")
    private Integer optionId;

    @Column(nullable = false, length = 80, unique = true)
    private String name;

    @Column(name = "extra_cost", nullable = false, precision = 10, scale = 2)
    private BigDecimal extraCost;

    @Column(name = "extra_minutes", nullable = false)
    private Integer extraMinutes;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    protected PersonalizationOption() {
    }

    public PersonalizationOption(String name, BigDecimal extraCost, Integer extraMinutes) {
        this.name = name;
        this.extraCost = extraCost;
        this.extraMinutes = extraMinutes;
        this.active = true;
    }

    public Integer getOptionId() {
        return optionId;
    }

    public String getName() {
        return name;
    }

    public BigDecimal getExtraCost() {
        return extraCost;
    }

    public Integer getExtraMinutes() {
        return extraMinutes;
    }

    public boolean isActive() {
        return active;
    }

    public void update(String name, BigDecimal extraCost, Integer extraMinutes) {
        this.name = name;
        this.extraCost = extraCost;
        this.extraMinutes = extraMinutes;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
