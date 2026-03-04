package com.englishflow.community.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateTopicRequest {
    
    @NotNull(message = "Sub-category ID is required")
    private Long subCategoryId;
    
    @NotBlank(message = "Title is required")
    @Size(max = 150, message = "Title must not exceed 150 characters")
    private String title;
    
    @Size(max = 5000, message = "Content must not exceed 5000 characters")
    private String content; // Optional for Resource Sharing
    
    @NotNull(message = "User ID is required")
    private Long userId;
    
    private String userName;
    
    private String resourceType; // "LINK", "PDF", "IMAGE", "VIDEO", null
    
    private String resourceLink; // URL or file path
}
