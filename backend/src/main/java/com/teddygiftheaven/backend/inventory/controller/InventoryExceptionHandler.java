package com.teddygiftheaven.backend.inventory.controller;

import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.teddygiftheaven.backend.inventory.service.InventoryNotFoundException;

// Turns errors from the inventory and shop endpoints into a clear message for the page.
// The most important case: when a V401 procedure or trigger refuses something with SIGNAL
// (for example "Sorry, only 2 of Big Brown Teddy left"), MySQL sends SQLSTATE 45000 and we pass
// that message straight to the user, because the database already wrote it in plain words.
@RestControllerAdvice(basePackageClasses = InventoryController.class)
public class InventoryExceptionHandler {

    public record ApiError(String code, String message, Map<String, String> fields) {
    }

    @ExceptionHandler(InventoryNotFoundException.class)
    public ResponseEntity<ApiError> notFound(InventoryNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError("NOT_FOUND", e.getMessage(), Map.of()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> invalid(MethodArgumentNotValidException e) {
        Map<String, String> fields = new LinkedHashMap<>();
        e.getBindingResult().getFieldErrors()
                .forEach(f -> fields.putIfAbsent(f.getField(), f.getDefaultMessage()));
        return ResponseEntity.badRequest().body(new ApiError("VALIDATION_ERROR", "Please check the form.", fields));
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<ApiError> database(DataAccessException e) {
        SQLException sql = findSqlException(e);
        if (sql != null && "45000".equals(sql.getSQLState())) {
            // a business rule from V401 said no
            return ResponseEntity.badRequest().body(new ApiError("RULE", sql.getMessage(), Map.of()));
        }
        if (sql != null && sql.getErrorCode() == 1062) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ApiError("DUPLICATE", "That name is already used.", Map.of()));
        }
        if (sql != null && (sql.getErrorCode() == 1451 || sql.getErrorCode() == 1452)) {
            // 1451: still in use (e.g. deleting a category that has products); 1452: unknown id
            String msg = sql.getErrorCode() == 1451
                    ? "This is still in use, so it can't be deleted."
                    : "The selected category or item doesn't exist.";
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiError("IN_USE", msg, Map.of()));
        }
        if (sql != null && sql.getErrorCode() == 3819) {
            return ResponseEntity.badRequest()
                    .body(new ApiError("RULE", "That value isn't allowed (it breaks a database check).", Map.of()));
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiError("DB_ERROR", "Something went wrong in the database.", Map.of()));
    }

    private static SQLException findSqlException(Throwable t) {
        while (t != null) {
            if (t instanceof SQLException s) return s;
            t = t.getCause();
        }
        return null;
    }
}
