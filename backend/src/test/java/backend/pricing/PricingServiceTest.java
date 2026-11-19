package backend.pricing;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import backend.pricing.dto.QuoteRequest;
import backend.pricing.dto.SelectedPersonalizationRequest;
import backend.pricing.model.PersonalizationOption;
import backend.pricing.model.ProductPricing;
import backend.pricing.repository.PersonalizationOptionRepository;
import backend.pricing.repository.PriceHistoryRepository;
import backend.pricing.repository.ProductPricingRepository;
import backend.pricing.service.PricingService;

@ExtendWith(MockitoExtension.class)
class PricingServiceTest {

    @Mock
    private ProductPricingRepository productRepository;

    @Mock
    private PersonalizationOptionRepository optionRepository;

    @Mock
    private PriceHistoryRepository priceHistoryRepository;

    @Test
    void quoteMultipliesBaseAndPersonalizationCostsByQuantity() {
        ProductPricing product = org.mockito.Mockito.mock(ProductPricing.class);
        PersonalizationOption option = org.mockito.Mockito.mock(PersonalizationOption.class);

        when(productRepository.findWithStockItemByItemId(10L)).thenReturn(Optional.of(product));
        when(product.isActive()).thenReturn(true);
        when(product.getItemId()).thenReturn(10L);
        when(product.getPrice()).thenReturn(new BigDecimal("100.00"));
        when(optionRepository.findAllByOptionIdIn(any())).thenReturn(List.of(option));
        when(option.getOptionId()).thenReturn(3);
        when(option.getName()).thenReturn("Message card");
        when(option.getExtraCost()).thenReturn(new BigDecimal("15.00"));
        when(option.isActive()).thenReturn(true);

        PricingService service = new PricingService(
                productRepository, optionRepository, priceHistoryRepository);

        var result = service.quote(new QuoteRequest(
                10L,
                2,
                List.of(new SelectedPersonalizationRequest(3, "Happy birthday"))));

        assertThat(result.baseSubtotal()).isEqualByComparingTo("200.00");
        assertThat(result.personalizationSubtotal()).isEqualByComparingTo("30.00");
        assertThat(result.total()).isEqualByComparingTo("230.00");
        assertThat(result.selectedOptions()).singleElement()
                .extracting(optionResult -> optionResult.customText())
                .isEqualTo("Happy birthday");
    }
}
