package com.englishflow.community.client;

import com.englishflow.community.dto.MemberDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
@Slf4j
public class ClubServiceClientFallback implements ClubServiceClient {
    
    @Override
    public List<MemberDTO> getUserMemberships(Long userId) {
        log.warn("Fallback: Unable to fetch user memberships for user {}. Returning empty list.", userId);
        return Collections.emptyList();
    }
}
