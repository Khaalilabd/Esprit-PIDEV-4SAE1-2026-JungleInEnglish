package com.englishflow.club.dto;

import com.englishflow.club.enums.ClubHistoryType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClubHistoryDTO {
    private Long id;
    private Long clubId;
    private Long userId;
    private ClubHistoryType type;
    private String action;
    private String description;
    private String oldValue;
    private String newValue;
    private Long performedBy;
    private String performedByName; // Nom de l'utilisateur qui a effectué l'action
    private LocalDateTime createdAt;
}
