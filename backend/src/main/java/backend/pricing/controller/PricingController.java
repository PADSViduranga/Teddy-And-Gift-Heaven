package backend.pricing.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import backend.pricing.dto.CreatePersonalizationOptionRequest;
import backend.pricing.dto.PersonalizationOptionResponse;
import backend.pricing.dto.ProductPricingResponse;
import backend.pricing.dto.QuoteRequest;
import backend.pricing.dto.QuoteResponse;
import backend.pricing.dto.UpdatePersonalizationOptionRequest;
import backend.pricing.dto.UpdatePriceRequest;
import backend.pricing.service.PricingService;

@RestController
@RequestMapping("/api/pricing")
public class PricingController {

    private final PricingService pricingService;

    public PricingController(PricingService pricingService) {
        this.pricingService = pricingService;
    }

    @GetMapping("/products")
    public List<ProductPricingResponse> listProducts() {
        return pricingService.listProducts();
    }

    @GetMapping("/products/{productId}")
    public ProductPricingResponse getProduct(@PathVariable Long productId) {
        return pricingService.getProduct(productId);
    }

    @PatchMapping("/products/{productId}/price")
    public ProductPricingResponse updatePrice(@PathVariable Long productId,
            @Valid @RequestBody UpdatePriceRequest request) {
        return pricingService.updatePrice(productId, request);
    }

    @GetMapping("/personalization-options")
    public List<PersonalizationOptionResponse> listOptions(
            @RequestParam(defaultValue = "false") boolean includeInactive) {
        return pricingService.listOptions(includeInactive);
    }

    @PostMapping("/personalization-options")
    @ResponseStatus(HttpStatus.CREATED)
    public PersonalizationOptionResponse createOption(
            @Valid @RequestBody CreatePersonalizationOptionRequest request) {
        return pricingService.createOption(request);
    }

    @PutMapping("/personalization-options/{optionId}")
    public PersonalizationOptionResponse updateOption(@PathVariable Integer optionId,
            @Valid @RequestBody UpdatePersonalizationOptionRequest request) {
        return pricingService.updateOption(optionId, request);
    }

    @PatchMapping("/personalization-options/{optionId}/status")
    public PersonalizationOptionResponse updateOptionStatus(@PathVariable Integer optionId,
            @RequestParam boolean active) {
        return pricingService.updateOptionStatus(optionId, active);
    }

    @PostMapping("/quotes")
    public QuoteResponse quote(@Valid @RequestBody QuoteRequest request) {
        return pricingService.quote(request);
    }
}
