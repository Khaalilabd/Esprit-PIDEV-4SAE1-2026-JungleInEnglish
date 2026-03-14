package com.englishflow.community.client;

import com.englishflow.community.dto.UserDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(
    name = "auth-service",
    path = "/auth",
    fallback = AuthServiceClientFallback.class
)
public interface AuthServiceClient {
    
    @GetMapping("/users/{userId}/public")
    UserDTO getUserById(@PathVariable("userId") Long userId);
}
