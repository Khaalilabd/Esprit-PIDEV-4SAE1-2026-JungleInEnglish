package com.englishflow.community.client;

import com.englishflow.community.dto.MemberDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(
    name = "club-service", 
    path = "/clubs",
    fallback = ClubServiceClientFallback.class
)
public interface ClubServiceClient {
    
    @GetMapping("/members/user/{userId}")
    List<MemberDTO> getUserMemberships(@PathVariable("userId") Long userId);
}
