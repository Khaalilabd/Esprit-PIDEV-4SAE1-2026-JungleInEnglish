package com.englishflow.event.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EventFeedbackStatsDTO {
    
    private Integer eventId;
    private Double averageRating;
    private Integer totalFeedbacks;
    private Double satisfactionRate; // Percentage of 4-5 star ratings
    private Map<Integer, Long> ratingDistribution; // Rating (1-5) -> Count
    
    public EventFeedbackStatsDTO(Integer eventId) {
        this.eventId = eventId;
        this.averageRating = 0.0;
        this.totalFeedbacks = 0;
        this.satisfactionRate = 0.0;
    }
}
