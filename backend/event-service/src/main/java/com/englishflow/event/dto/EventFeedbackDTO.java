package com.englishflow.event.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EventFeedbackDTO {
    
    private Long id;
    
    @NotNull(message = "Event ID is required")
    private Integer eventId;
    
    @NotNull(message = "User ID is required")
    private Long userId;
    
    @NotNull(message = "Rating is required")
    @DecimalMin(value = "0.5", message = "Rating must be at least 0.5")
    @DecimalMax(value = "5.0", message = "Rating must be at most 5.0")
    private Double rating;
    
    @Size(max = 500, message = "Comment must not exceed 500 characters")
    private String comment;
    
    private Boolean anonymous = false;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    // Additional fields for display
    private String userFirstName;
    private String userLastName;
    private String userImage;
}
