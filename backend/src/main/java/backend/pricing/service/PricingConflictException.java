package backend.pricing.service;

public class PricingConflictException extends RuntimeException {

    public PricingConflictException(String message) {
        super(message);
    }
}
