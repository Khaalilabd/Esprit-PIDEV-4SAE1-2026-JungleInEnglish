package com.englishflow.gateway.filter;

import com.englishflow.gateway.util.JwtUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
@Slf4j
public class AuthenticationFilter extends AbstractGatewayFilterFactory<AuthenticationFilter.Config> {

    @Autowired
    private JwtUtil jwtUtil;

    public AuthenticationFilter() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            // Check if Authorization header exists
            if (!exchange.getRequest().getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
                log.warn("Missing authorization header for request: {}", exchange.getRequest().getPath());
                return onError(exchange, "Missing authorization header", HttpStatus.UNAUTHORIZED);
            }

            String authHeader = exchange.getRequest().getHeaders().get(HttpHeaders.AUTHORIZATION).get(0);
            String token = null;
            
            // Extract token from Bearer header
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            } else {
                log.warn("Invalid authorization header format for request: {}", exchange.getRequest().getPath());
                return onError(exchange, "Invalid authorization header format", HttpStatus.UNAUTHORIZED);
            }

            // ✅ IMPLEMENTED: Validate JWT token
            if (!jwtUtil.validateToken(token)) {
                log.warn("Invalid or expired JWT token for request: {}", exchange.getRequest().getPath());
                return onError(exchange, "Invalid or expired token", HttpStatus.UNAUTHORIZED);
            }
            
            // Extract user information and add to headers for downstream services
            try {
                String username = jwtUtil.extractUsername(token);
                Long userId = jwtUtil.extractUserId(token);
                String role = jwtUtil.extractRole(token);
                
                // Add user info to request headers for downstream services
                ServerWebExchange modifiedExchange = exchange.mutate()
                        .request(r -> r.headers(headers -> {
                            if (username != null) headers.add("X-User-Email", username);
                            if (userId != null) headers.add("X-User-Id", userId.toString());
                            if (role != null) headers.add("X-User-Role", role);
                        }))
                        .build();
                
                log.debug("JWT validated successfully for user: {} (ID: {}, Role: {})", username, userId, role);
                return chain.filter(modifiedExchange);
                
            } catch (Exception e) {
                log.error("Error processing JWT token: {}", e.getMessage());
                return onError(exchange, "Error processing token", HttpStatus.INTERNAL_SERVER_ERROR);
            }
        };
    }

    private Mono<Void> onError(ServerWebExchange exchange, String err, HttpStatus httpStatus) {
        log.error("Authentication error: {} - Status: {}", err, httpStatus);
        exchange.getResponse().setStatusCode(httpStatus);
        return exchange.getResponse().setComplete();
    }

    public static class Config {
        // Configuration properties if needed
    }
}
