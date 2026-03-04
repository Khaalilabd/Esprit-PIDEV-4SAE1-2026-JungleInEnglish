package com.englishflow.complaints.dto;

import com.englishflow.complaints.enums.ComplaintCategory;
import com.englishflow.complaints.enums.TargetRole;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateComplaintRequest {
    
    @NotNull(message = "User ID is required")
    private Long userId;
    
    @NotNull(message = "Target role is required")
    private TargetRole targetRole;
    
    @NotNull(message = "Category is required")
    private ComplaintCategory category;
    
    @NotBlank(message = "Subject is required and cannot be empty")
    @Size(min = 5, max = 200, message = "Subject must be between 5 and 200 characters")
    private String subject;
    
    @NotBlank(message = "Description is required and cannot be empty")
    @Size(min = 20, max = 5000, message = "Description must be between 20 and 5000 characters")
    private String description;
    
    // Champs optionnels selon la catégorie
    @Size(max = 100, message = "Course type must not exceed 100 characters")
    private String courseType;
    
    @Size(max = 100, message = "Difficulty must not exceed 100 characters")
    private String difficulty;
    
    @Size(max = 100, message = "Issue type must not exceed 100 characters")
    private String issueType;
    
    @Min(value = 0, message = "Session count must be positive")
    @Max(value = 1000, message = "Session count seems unrealistic")
    private Integer sessionCount;
    
    @Min(value = 1, message = "Club ID must be positive")
    private Integer clubId;
}
