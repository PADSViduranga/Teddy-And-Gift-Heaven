package backend.pricing.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import backend.pricing.dto.CreatePersonalizationOptionRequest;
import backend.pricing.dto.PersonalizationOptionResponse;
import backend.pricing.dto.ProductPricingResponse;
import backend.pricing.dto.QuoteRequest;
import backend.pricing.dto.QuoteResponse;
import backend.pricing.dto.SelectedPersonalizationRequest;
import backend.pricing.dto.SelectedPersonalizationResponse;
import backend.pricing.dto.UpdatePersonalizationOptionRequest;
import backend.pricing.dto.UpdatePriceRequest;
import backend.pricing.model.PersonalizationOption;
import backend.pricing.model.PriceHistory;
import backend.pricing.model.ProductPricing;
import backend.pricing.repository.PersonalizationOptionRepository;
import backend.pricing.repository.PriceHistoryRepository;
import backend.pricing.repository.ProductPricingRepository;

@Service
public class PricingService {

    private static final int MONEY_SCALE = 2;

    private final ProductPricingRepository productRepository;
    private final PersonalizationOptionRepository optionRepository;
    private final PriceHistoryRepository priceHistoryRepository;

    public PricingService(ProductPricingRepository productRepository,
            PersonalizationOptionRepository optionRepository,
            PriceHistoryRepository priceHistoryRepository) {
        this.productRepository = productRepository;
        this.optionRepository = optionRepository;
        this.priceHistoryRepository = priceHistoryRepository;
    }

    @Transactional(readOnly = true)
    public List<ProductPricingResponse> listProducts() {
        List<PersonalizationOptionResponse> options = activeOptions();
        return productRepository.findAllByOrderByItemIdAsc().stream()
                .map(product -> ProductPricingResponse.from(product, options))
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductPricingResponse getProduct(Long productId) {
        return ProductPricingResponse.from(findProduct(productId), activeOptions());
    }

    @Transactional
    public ProductPricingResponse updatePrice(Long productId, UpdatePriceRequest request) {
        ProductPricing product = findProduct(productId);
        BigDecimal oldPrice = product.getPrice();
        BigDecimal newPrice = request.basePrice().setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        if (oldPrice.compareTo(newPrice) != 0) {
            product.updatePrice(newPrice);
            priceHistoryRepository.save(new PriceHistory(productId, oldPrice, newPrice));
        }

        return ProductPricingResponse.from(product, activeOptions());
    }

    @Transactional(readOnly = true)
    public List<PersonalizationOptionResponse> listOptions(boolean includeInactive) {
        return optionRepository.findAllByOrderByNameAsc().stream()
                .filter(option -> includeInactive || option.isActive())
                .map(PersonalizationOptionResponse::from)
                .toList();
    }

    @Transactional
    public PersonalizationOptionResponse createOption(CreatePersonalizationOptionRequest request) {
        ensureOptionNameAvailable(request.name(), null);
        try {
            return PersonalizationOptionResponse.from(optionRepository.save(
                    new PersonalizationOption(
                            request.name().trim(),
                            request.extraCost().setScale(MONEY_SCALE, RoundingMode.HALF_UP),
                            request.extraMinutes())));
        } catch (DataIntegrityViolationException exception) {
            throw new PricingConflictException("A personalization option with that name already exists.");
        }
    }

    @Transactional
    public PersonalizationOptionResponse updateOption(Integer optionId,
            UpdatePersonalizationOptionRequest request) {
        PersonalizationOption option = findOption(optionId);
        ensureOptionNameAvailable(request.name(), optionId);
        option.update(
                request.name().trim(),
                request.extraCost().setScale(MONEY_SCALE, RoundingMode.HALF_UP),
                request.extraMinutes());
        return PersonalizationOptionResponse.from(option);
    }

    @Transactional
    public PersonalizationOptionResponse updateOptionStatus(Integer optionId, boolean active) {
        PersonalizationOption option = findOption(optionId);
        option.setActive(active);
        return PersonalizationOptionResponse.from(option);
    }

    @Transactional(readOnly = true)
    public QuoteResponse quote(QuoteRequest request) {
        ProductPricing product = findProduct(request.productId());
        if (!product.isActive()) {
            throw new PricingValidationException("The selected product is inactive.");
        }

        List<SelectedPersonalizationRequest> selections = request.selectedOptions();
        Set<Integer> requestedIds = selections.stream()
                .map(SelectedPersonalizationRequest::optionId)
                .collect(Collectors.toSet());
        if (requestedIds.size() != selections.size()) {
            throw new PricingValidationException("A personalization option can only be selected once.");
        }

        Map<Integer, PersonalizationOption> optionsById = optionRepository
                .findAllByOptionIdIn(requestedIds).stream()
                .collect(Collectors.toMap(PersonalizationOption::getOptionId, Function.identity()));
        if (optionsById.size() != requestedIds.size()) {
            throw new PricingValidationException("One or more personalization options do not exist.");
        }
        if (optionsById.values().stream().anyMatch(option -> !option.isActive())) {
            throw new PricingValidationException("Inactive personalization options cannot be selected.");
        }

        BigDecimal quantity = BigDecimal.valueOf(request.quantity());
        BigDecimal baseSubtotal = product.getPrice().multiply(quantity);
        List<SelectedPersonalizationResponse> selectedOptions = selections.stream()
                .map(selection -> toSelectionResponse(selection, optionsById.get(selection.optionId()), quantity))
                .toList();
        BigDecimal personalizationSubtotal = selectedOptions.stream()
                .map(SelectedPersonalizationResponse::totalExtraCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new QuoteResponse(
                product.getItemId(),
                request.quantity(),
                product.getPrice(),
                money(baseSubtotal),
                money(personalizationSubtotal),
                money(baseSubtotal.add(personalizationSubtotal)),
                selectedOptions);
    }

    private SelectedPersonalizationResponse toSelectionResponse(
            SelectedPersonalizationRequest selection,
            PersonalizationOption option,
            BigDecimal quantity) {
        String customText = selection.customText();
        if (customText != null && customText.isBlank()) {
            customText = null;
        }
        return new SelectedPersonalizationResponse(
                option.getOptionId(),
                option.getName(),
                customText,
                option.getExtraCost(),
                money(option.getExtraCost().multiply(quantity)));
    }

    private List<PersonalizationOptionResponse> activeOptions() {
        return listOptions(false);
    }

    private ProductPricing findProduct(Long productId) {
        return productRepository.findWithStockItemByItemId(productId)
                .orElseThrow(() -> new PricingNotFoundException("Product was not found."));
    }

    private PersonalizationOption findOption(Integer optionId) {
        return optionRepository.findById(optionId)
                .orElseThrow(() -> new PricingNotFoundException("Personalization option was not found."));
    }

    private void ensureOptionNameAvailable(String name, Integer currentOptionId) {
        optionRepository.findByNameIgnoreCase(name.trim())
                .filter(option -> !option.getOptionId().equals(currentOptionId))
                .ifPresent(option -> {
                    throw new PricingConflictException("A personalization option with that name already exists.");
                });
    }

    private BigDecimal money(BigDecimal amount) {
        return amount.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }
}
