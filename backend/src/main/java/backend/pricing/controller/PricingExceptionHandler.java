package backend.pricing.controller;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import backend.pricing.service.PricingConflictException;
import backend.pricing.service.PricingNotFoundException;
import backend.pricing.service.PricingValidationException;

@RestControllerAdvice(basePackageClasses = PricingController.class)
public class PricingExceptionHandler {

    @ExceptionHandler(PricingNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(PricingNotFoundException exception) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiError("NOT_FOUND", exception.getMessage(), Map.of()));
    }

    @ExceptionHandler({ PricingConflictException.class, PricingValidationException.class })
    public ResponseEntity<ApiError> handleBusinessError(RuntimeException exception) {
        HttpStatus status = exception instanceof PricingConflictException
                ? HttpStatus.CONFLICT
                : HttpStatus.BAD_REQUEST;
        return ResponseEntity.status(status)
                .body(new ApiError("INVALID_PRICING_REQUEST", exception.getMessage(), Map.of()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException exception) {
        Map<String, String> fields = new LinkedHashMap<>();
        exception.getBindingResult().getFieldErrors()
                .forEach(error -> fields.putIfAbsent(error.getField(), error.getDefaultMessage()));
        return ResponseEntity.badRequest()
                .body(new ApiError("VALIDATION_ERROR", "Request validation failed.", fields));
    }

    public record ApiError(String code, String message, Map<String, String> fields) {
    }
}
