package backend.pricing.dto;

import java.math.BigDecimal;

import backend.pricing.model.PersonalizationOption;

public record PersonalizationOptionResponse(
        Integer optionId,
        String name,
        BigDecimal extraCost,
        Integer extraMinutes,
        boolean active) {

    public static PersonalizationOptionResponse from(PersonalizationOption option) {
        return new PersonalizationOptionResponse(
                option.getOptionId(),
                option.getName(),
                option.getExtraCost(),
                option.getExtraMinutes(),
                option.isActive());
    }
}
