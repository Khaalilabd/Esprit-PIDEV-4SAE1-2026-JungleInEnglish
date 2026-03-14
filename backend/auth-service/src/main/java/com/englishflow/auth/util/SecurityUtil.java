package com.englishflow.auth.util;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SecurityUtil {
    
    /**
     * Extract user ID from the current authentication context
     * The JWT filter stores the userId as the principal
     * @return User ID from JWT token
     * @throws RuntimeException if user is not authenticated
     */
    public Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User is not authenticated");
        }
        
        Object principal = authentication.getPrincipal();
        
        // The JwtAuthenticationFilter stores userId as principal
        if (principal instanceof Long) {
            return (Long) principal;
        }
        
        // For OAuth2 users or other cases, try to parse
        if (principal instanceof String) {
            try {
                return Long.parseLong((String) principal);
            } catch (NumberFormatException e) {
                throw new RuntimeException("Unable to extract user ID from authentication context. Principal: " + principal);
            }
        }
        
        throw new RuntimeException("Unable to extract user ID from authentication context. Principal type: " + principal.getClass().getName());
    }
    
    /**
     * Check if current user is authenticated
     * @return true if authenticated, false otherwise
     */
    public boolean isAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.isAuthenticated() 
               && !"anonymousUser".equals(authentication.getPrincipal());
    }
}
