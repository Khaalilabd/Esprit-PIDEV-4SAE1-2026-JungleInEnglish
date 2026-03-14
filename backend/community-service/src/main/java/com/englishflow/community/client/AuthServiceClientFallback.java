package com.englishflow.community.client;

import com.englishflow.community.dto.UserDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class AuthServiceClientFallback implements AuthServiceClient {
    
    @Override
    public UserDTO getUserById(Long userId) {
        log.error("Fallback: Unable to fetch user {} from auth-service", userId);
        return null;
    }
}
