package com.englishflow.gateway.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
@Slf4j
public class JwtUtil {
    
    @Value("${jwt.secret}")
    private String secret;
    
    /**
     * Validate JWT token
     * @param token JWT token
     * @return true if valid, false otherwise
     */
    public boolean validateToken(String token) {
        try {
            Claims claims = getClaims(token);
            
            // Check if token is expired
            if (claims.getExpiration().before(new Date())) {
                log.warn("JWT token is expired");
                return false;
            }
            
            log.debug("JWT token validated successfully for user: {}", claims.getSubject());
            return true;
            
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            log.warn("JWT token is expired: {}", e.getMessage());
            return false;
        } catch (io.jsonwebtoken.MalformedJwtException e) {
            log.warn("JWT token is malformed: {}", e.getMessage());
            return false;
        } catch (io.jsonwebtoken.security.SignatureException e) {
            log.warn("JWT signature validation failed: {}", e.getMessage());
            return false;
        } catch (Exception e) {
            log.error("Error validating JWT token: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Extract claims from JWT token
     * @param token JWT token
     * @return Claims
     */
    public Claims getClaims(String token) {
        SecretKey key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
    
    /**
     * Extract username from JWT token
     * @param token JWT token
     * @return username (email)
     */
    public String extractUsername(String token) {
        try {
            return getClaims(token).getSubject();
        } catch (Exception e) {
            log.error("Error extracting username from token: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * Extract user ID from JWT token
     * @param token JWT token
     * @return user ID
     */
    public Long extractUserId(String token) {
        try {
            Claims claims = getClaims(token);
            Object userIdObj = claims.get("userId");
            
            if (userIdObj instanceof Integer) {
                return ((Integer) userIdObj).longValue();
            } else if (userIdObj instanceof Long) {
                return (Long) userIdObj;
            }
            
            return null;
        } catch (Exception e) {
            log.error("Error extracting user ID from token: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * Extract role from JWT token
     * @param token JWT token
     * @return role
     */
    public String extractRole(String token) {
        try {
            return (String) getClaims(token).get("role");
        } catch (Exception e) {
            log.error("Error extracting role from token: {}", e.getMessage());
            return null;
        }
    }
}
