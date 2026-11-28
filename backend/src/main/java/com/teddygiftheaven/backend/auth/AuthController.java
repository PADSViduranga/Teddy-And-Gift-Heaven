package com.teddygiftheaven.backend.auth;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import com.teddygiftheaven.backend.auth.AccountService.Account;
import com.teddygiftheaven.backend.config.SecurityConfig;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AccountService accounts;
    private final JwtEncoder encoder;

    public AuthController(AccountService accounts, JwtEncoder encoder) {
        this.accounts = accounts;
        this.encoder = encoder;
    }

    public enum Portal {
        CUSTOMER, STAFF, ADMIN;

        boolean accepts(String role) {
            return switch (this) {
                case CUSTOMER -> "CUSTOMER".equals(role);
                case STAFF -> !"CUSTOMER".equals(role);
                case ADMIN -> "OWNER".equals(role);
            };
        }
    }

    public record Login(@NotBlank @Email @Size(max = 150) String email,
                        @NotBlank @Size(max = 72) String password,
                        @NotNull Portal portal) {}
    public record Registration(@NotBlank @Size(max = 120) String name,
                               @NotBlank @Email @Size(max = 150) @Pattern(regexp = "[^@]+@[^@]+[.][^@]+") String email,
                               @NotBlank @Size(min = 9, max = 15) @Pattern(regexp = "[+]?[0-9][0-9 ]*") String phone,
                               @NotBlank @Size(min = 12, max = 72) String password) {}
    public record Session(String token, String role, String name, Instant expiresAt) {}

    @ExceptionHandler({MethodArgumentNotValidException.class, HttpMessageNotReadableException.class})
    public ResponseEntity<Void> invalidInput() {
        return ResponseEntity.badRequest().cacheControl(CacheControl.noStore()).build();
    }

    @PostMapping("/login")
    public ResponseEntity<Session> login(@Valid @RequestBody Login request) {
        Account account = accounts.login(request.email(), request.password(), request.portal());
        if (account == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unable to sign in with those credentials.");
        }
        return session(account, HttpStatus.OK);
    }

    @PostMapping("/register")
    public ResponseEntity<Session> register(@Valid @RequestBody Registration request) {
        return session(accounts.register(request), HttpStatus.CREATED);
    }

    @GetMapping("/me")
    public ResponseEntity<Account> me(java.security.Principal principal) {
        Account account = accounts.activeAccount(Long.parseLong(principal.getName()));
        if (account == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(account);
    }

    private ResponseEntity<Session> session(Account account, HttpStatus status) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(30, ChronoUnit.MINUTES);
        var claims = JwtClaimsSet.builder().subject(Long.toString(account.id())).issuer(SecurityConfig.ISSUER)
            .issuedAt(now).expiresAt(expiresAt).claim("role", account.role()).build();
        var header = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        return ResponseEntity.status(status).cacheControl(CacheControl.noStore())
            .body(new Session(token, account.role(), account.name(), expiresAt));
    }
}
