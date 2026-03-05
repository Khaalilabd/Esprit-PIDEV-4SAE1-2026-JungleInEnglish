package com.jungle.learning.service;

import com.jungle.learning.dto.UserDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceClient {

    private final RestTemplate restTemplate;

    @Value("${auth.service.url:http://localhost:8081}")
    private String authServiceUrl;

    @Cacheable(value = "users", key = "#userId")
    public UserDTO getUserById(Long userId) {
        try {
            String url = authServiceUrl + "/users/" + userId + "/public";
            log.debug("Fetching user info from: {}", url);
            UserDTO user = restTemplate.getForObject(url, UserDTO.class);
            
            if (user != null) {
                log.debug("Successfully fetched user: {} {}", user.getFirstName(), user.getLastName());
            }
            
            return user;
        } catch (Exception e) {
            log.error("Error fetching user info for userId: {}", userId, e);
            // Return a default user if the service is unavailable
            UserDTO fallback = new UserDTO();
            fallback.setId(userId);
            fallback.setFirstName("User");
            fallback.setLastName(String.valueOf(userId));
            return fallback;
        }
    }

    public String getUserName(Long userId) {
        UserDTO user = getUserById(userId);
        return user != null ? user.getFullName() : "User " + userId;
    }
}
