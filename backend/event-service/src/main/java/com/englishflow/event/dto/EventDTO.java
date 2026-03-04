    package com.englishflow.event.dto;

import com.englishflow.event.enums.EventStatus;
import com.englishflow.event.enums.EventType;
import com.englishflow.event.validation.ValidEventDates;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@ValidEventDates
public class EventDTO {
    
    private Integer id;
    
    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 100, message = "Title must be between 3 and 100 characters")
    private String title;
    
    @NotNull(message = "Event type is required")
    private EventType type;
    
    @NotNull(message = "Start date is required")
    private LocalDateTime startDate;
    
    @NotNull(message = "End date is required")
    private LocalDateTime endDate;
    
    @NotBlank(message = "Location is required")
    private String location;
    
    private Double latitude;
    
    private Double longitude;
    
    @NotNull(message = "Max participants is required")
    @Min(value = 1, message = "Max participants must be at least 1")
    private Integer maxParticipants;
    
    private Integer currentParticipants;
    
    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;
    
    private Long creatorId;
    
    private Integer clubId;
    
    private String clubName;
    
    private String image;
    
    private java.util.List<String> gallery; // Gallery of base64 encoded images
    
    private EventStatus status;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    // Feedback statistics
    private Double averageRating;
    private Integer totalFeedbacks;
    private Double satisfactionRate;
    private Boolean hasUserGivenFeedback;
}
