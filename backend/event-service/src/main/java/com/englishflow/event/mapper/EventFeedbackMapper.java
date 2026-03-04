package com.englishflow.event.mapper;

import com.englishflow.event.dto.EventFeedbackDTO;
import com.englishflow.event.entity.EventFeedback;
import org.springframework.stereotype.Component;

@Component
public class EventFeedbackMapper {
    
    public EventFeedbackDTO toDTO(EventFeedback feedback) {
        if (feedback == null) {
            return null;
        }
        
        EventFeedbackDTO dto = new EventFeedbackDTO();
        dto.setId(feedback.getId());
        dto.setEventId(feedback.getEventId());
        dto.setUserId(feedback.getUserId());
        dto.setRating(feedback.getRating());
        dto.setComment(feedback.getComment());
        dto.setAnonymous(feedback.getAnonymous());
        dto.setCreatedAt(feedback.getCreatedAt());
        dto.setUpdatedAt(feedback.getUpdatedAt());
        
        return dto;
    }
    
    public EventFeedback toEntity(EventFeedbackDTO dto) {
        if (dto == null) {
            return null;
        }
        
        EventFeedback feedback = new EventFeedback();
        feedback.setId(dto.getId());
        feedback.setEventId(dto.getEventId());
        feedback.setUserId(dto.getUserId());
        feedback.setRating(dto.getRating());
        feedback.setComment(dto.getComment());
        feedback.setAnonymous(dto.getAnonymous() != null ? dto.getAnonymous() : false);
        
        return feedback;
    }
}
