package com.teddygiftheaven.backend.config;

import java.util.List;
import java.nio.charset.StandardCharsets;
import javax.crypto.spec.SecretKeySpec;
import jakarta.servlet.DispatcherType;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.teddygiftheaven.backend.auth.AccountService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {

    public static final String ISSUER = "teddy-and-gift-heaven";

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http, AccountService accounts) throws Exception {
        http.csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/register").permitAll()
                .requestMatchers("/api/health", "/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/auth/me").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/shop/**").hasRole("CUSTOMER")
                .requestMatchers("/api/dashboard/owner", "/api/audit/**", "/api/backups/**").hasRole("OWNER")
                .requestMatchers("/api/dashboard/order-staff").hasRole("ORDER_STAFF")
                .requestMatchers("/api/dashboard/inventory").hasRole("INVENTORY_MANAGER")
                .requestMatchers("/api/dashboard/packer").hasRole("PACKER")
                .requestMatchers("/api/dashboard/driver").hasRole("DRIVER")
                .requestMatchers(HttpMethod.GET, "/api/reports/stock-loss", "/api/reports/stock-flow")
                    .hasAnyRole("OWNER", "INVENTORY_MANAGER")
                .requestMatchers("/api/reports/**", "/api/pricing/**").hasRole("OWNER")
                .requestMatchers(HttpMethod.GET, "/api/inventory/products", "/api/inventory/products/{id}",
                    "/api/inventory/categories").hasAnyRole("OWNER", "INVENTORY_MANAGER", "ORDER_STAFF")
                .requestMatchers(HttpMethod.GET, "/api/inventory/packaging").hasAnyRole("OWNER", "INVENTORY_MANAGER", "PACKER")
                .requestMatchers(HttpMethod.GET, "/api/inventory/items", "/api/inventory/stock/losses")
                    .hasAnyRole("OWNER", "INVENTORY_MANAGER", "ORDER_STAFF", "PACKER")
                .requestMatchers(HttpMethod.POST, "/api/inventory/stock/losses")
                    .hasAnyRole("OWNER", "INVENTORY_MANAGER", "ORDER_STAFF", "PACKER")
                .requestMatchers("/api/inventory/summary", "/api/inventory/categories", "/api/inventory/categories/{id}",
                    "/api/inventory/products", "/api/inventory/products/{id}", "/api/inventory/packaging",
                    "/api/inventory/packaging/{id}", "/api/inventory/owners", "/api/inventory/stock/adjust",
                    "/api/inventory/stock/movements", "/api/inventory/stock/low", "/api/inventory/stock/reservations")
                    .hasAnyRole("OWNER", "INVENTORY_MANAGER")
                .anyRequest().denyAll())
            .oauth2ResourceServer(resource -> resource.jwt(jwt -> jwt.jwtAuthenticationConverter(token -> {
                var account = accounts.activeAccount(Long.parseLong(token.getSubject()));
                if (account == null || !account.role().equals(token.getClaimAsString("role"))) {
                    throw new InvalidBearerTokenException("Account access has changed");
                }
                return new JwtAuthenticationToken(token, List.of(new SimpleGrantedAuthority("ROLE_" + account.role())));
            })));
        return http.build();
    }

    @Bean
    SecretKeySpec jwtSigningKey(@Value("${app.jwt.secret}") String secret) {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) throw new IllegalStateException("Configure app.jwt.secret with at least 32 random bytes");
        return new SecretKeySpec(bytes, "HmacSHA256");
    }

    @Bean
    NimbusJwtEncoder jwtEncoder(SecretKeySpec key) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(key));
    }

    @Bean
    NimbusJwtDecoder jwtDecoder(SecretKeySpec key) {
        var decoder = NimbusJwtDecoder.withSecretKey(key).build();
        decoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(ISSUER));
        return decoder;
    }

    @Bean
    BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    CorsConfigurationSource corsSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost:5174"));
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }
}
