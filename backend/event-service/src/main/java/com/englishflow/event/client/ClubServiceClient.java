package com.englishflow.event.client;

import com.englishflow.event.config.FeignConfig;
import com.englishflow.event.dto.ClubDTO;
import com.englishflow.event.dto.MemberDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "club-service", configuration = FeignConfig.class)
public interface ClubServiceClient {
    
    @GetMapping("/members/user/{userId}")
    List<MemberDTO> getMembersByUserId(@PathVariable("userId") Long userId);
    
    @GetMapping("/clubs/{clubId}")
    ClubDTO getClubById(@PathVariable("clubId") Integer clubId);
}
