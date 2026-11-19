package backend.pricing.service;

public class PricingValidationException extends RuntimeException {

    public PricingValidationException(String message) {
        super(message);
    }
}
