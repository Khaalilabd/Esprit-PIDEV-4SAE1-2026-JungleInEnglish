package com.englishflow.club.dto;

import com.englishflow.club.enums.ClubCategory;
import com.englishflow.club.enums.ClubStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
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
public class ClubDTO {
    
    private Integer id;
    
    @NotBlank(message = "Club name is required")
    private String name;
    
    @NotBlank(message = "Description is required")
    private String description;
    
    private String objective;
    
    @NotNull(message = "Category is required")
    private ClubCategory category;
    
    @NotNull(message = "Max members is required")
    @Min(value = 1, message = "Max members must be at least 1")
    private Integer maxMembers;
    
    private String image; // Base64 encoded image
    
    private ClubStatus status;
    
    private Integer createdBy;
    
    private String creatorName; // Nom du créateur récupéré du service auth
    
    private Integer currentMembersCount; // Nombre actuel de membres
    
    private Integer reviewedBy;
    
    private String reviewComment;
    
    private Integer suspendedBy; // User ID du manager qui a suspendu
    
    private String suspensionReason; // Raison de la suspension
    
    private LocalDateTime suspendedAt; // Date de suspension
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
