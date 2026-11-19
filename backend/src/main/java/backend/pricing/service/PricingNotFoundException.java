package backend.pricing.service;

public class PricingNotFoundException extends RuntimeException {

    public PricingNotFoundException(String message) {
        super(message);
    }
}
