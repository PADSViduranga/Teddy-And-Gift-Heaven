package com.teddygiftheaven.backend.auth;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AccountService {
    private final JdbcTemplate jdbc;
    private final BCryptPasswordEncoder passwords;
    private final String dummyHash;

    public AccountService(JdbcTemplate jdbc, BCryptPasswordEncoder passwords) {
        this.jdbc = jdbc;
        this.passwords = passwords;
        this.dummyHash = passwords.encode("unused-password-for-unknown-accounts");
    }

    public record Account(long id, String name, String role) {}
    private record LoginAccount(Account account, String hash, boolean active, boolean locked, int failures) {}

    public Account activeAccount(long id) {
        return jdbc.query("""
            SELECT u.user_id, u.full_name, r.name
            FROM users u JOIN roles r ON r.role_id = u.role_id
            WHERE u.user_id = ? AND u.is_active
            """, (rs, row) -> new Account(rs.getLong(1), rs.getString(2), rs.getString(3)), id)
            .stream().findFirst().orElse(null);
    }

    @Transactional
    public Account login(String email, String password, AuthController.Portal portal) {
        if (passwordTooLong(password)) return null;
        LoginAccount login = jdbc.query("""
            SELECT u.user_id, u.full_name, r.name, u.password_hash, u.is_active,
                   u.locked_until > NOW(), IF(u.locked_until IS NULL, u.failed_logins, 0)
            FROM users u JOIN roles r ON r.role_id = u.role_id
            WHERE u.email = ? FOR UPDATE OF u
            """, (rs, row) -> new LoginAccount(new Account(rs.getLong(1), rs.getString(2), rs.getString(3)),
                rs.getString(4), rs.getBoolean(5), rs.getBoolean(6), rs.getInt(7)), normalizeEmail(email))
            .stream().findFirst().orElse(null);

        boolean usableHash = login != null && login.hash().matches("\\$2[aby]?\\$[0-9]{2}\\$[./A-Za-z0-9]{53}");
        boolean matches = passwords.matches(password, usableHash ? login.hash() : dummyHash);
        if (login == null || !login.active() || login.locked()) return null;

        if (!matches || !usableHash) {
            int failures = login.failures() + 1;
            jdbc.update("""
                UPDATE users SET failed_logins = ?, locked_until = IF(? >= 5, NOW() + INTERVAL 15 MINUTE, NULL)
                WHERE user_id = ?
                """, failures, failures, login.account().id());
            return null;
        }

        jdbc.update("UPDATE users SET failed_logins = 0, locked_until = NULL WHERE user_id = ?", login.account().id());
        return portal.accepts(login.account().role()) ? login.account() : null;
    }

    @Transactional
    public Account register(AuthController.Registration request) {
        if (passwordTooLong(request.password())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at most 72 UTF-8 bytes.");
        }
        String name = request.name().trim();
        String hash = passwords.encode(request.password());
        long id;
        try {
            id = jdbc.queryForObject("CALL sp_register_customer(?, ?, ?, ?)", Long.class,
                name, normalizeEmail(request.email()), request.phone(), hash);
        } catch (DuplicateKeyException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account already uses this email.");
        }
        return new Account(id, name, "CUSTOMER");
    }

    private static boolean passwordTooLong(String password) {
        return password.getBytes(StandardCharsets.UTF_8).length > 72;
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
