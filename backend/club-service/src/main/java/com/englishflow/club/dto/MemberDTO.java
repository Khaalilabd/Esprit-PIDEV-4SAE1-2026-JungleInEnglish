package com.englishflow.club.dto;

import com.englishflow.club.enums.RankType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberDTO {
    
    private Integer id;
    
    @NotNull(message = "Rank is required")
    private RankType rank;
    
    @NotNull(message = "Club ID is required")
    private Integer clubId;
    
    @NotNull(message = "User ID is required")
    private Long userId;
    
    private String userName; // Nom de l'utilisateur récupéré du service auth
    
    private LocalDateTime joinedAt;
}
