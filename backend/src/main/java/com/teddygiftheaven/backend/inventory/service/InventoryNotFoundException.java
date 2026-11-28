package com.teddygiftheaven.backend.inventory.service;

// Thrown when a product, category or item id doesn't exist; the handler turns it into 404.
public class InventoryNotFoundException extends RuntimeException {
    public InventoryNotFoundException(String message) {
        super(message);
    }
}
