package com.englishflow.event.service;

import com.englishflow.event.dto.EventFeedbackDTO;
import com.englishflow.event.dto.EventFeedbackStatsDTO;
import com.englishflow.event.entity.Event;
import com.englishflow.event.entity.EventFeedback;
import com.englishflow.event.entity.Participant;
import com.englishflow.event.exception.ResourceNotFoundException;
import com.englishflow.event.exception.UnauthorizedException;
import com.englishflow.event.mapper.EventFeedbackMapper;
import com.englishflow.event.repository.EventFeedbackRepository;
import com.englishflow.event.repository.EventRepository;
import com.englishflow.event.repository.ParticipantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventFeedbackService {
    
    private final EventFeedbackRepository feedbackRepository;
    private final EventRepository eventRepository;
    private final ParticipantRepository participantRepository;
    private final EventFeedbackMapper feedbackMapper;
    
    @Transactional
    public EventFeedbackDTO createFeedback(EventFeedbackDTO feedbackDTO) {
        log.info("Creating feedback for event {} by user {}", feedbackDTO.getEventId(), feedbackDTO.getUserId());
        
        // Verify event exists
        Event event = eventRepository.findById(feedbackDTO.getEventId())
            .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + feedbackDTO.getEventId()));
        
        // Verify event has ended
        if (event.getEndDate().isAfter(LocalDateTime.now())) {
            throw new UnauthorizedException("Cannot give feedback for an event that hasn't ended yet");
        }
        
        // Verify user was a participant
        boolean wasParticipant = participantRepository.existsByEventIdAndUserId(
            feedbackDTO.getEventId(), 
            feedbackDTO.getUserId()
        );
        
        if (!wasParticipant && !event.getCreatorId().equals(feedbackDTO.getUserId())) {
            throw new UnauthorizedException("Only participants can give feedback");
        }
        
        // Verify user hasn't already given feedback
        if (feedbackRepository.existsByEventIdAndUserId(feedbackDTO.getEventId(), feedbackDTO.getUserId())) {
            throw new IllegalStateException("You have already given feedback for this event");
        }
        
        // Create feedback
        EventFeedback feedback = feedbackMapper.toEntity(feedbackDTO);
        feedback = feedbackRepository.save(feedback);
        
        log.info("Feedback created successfully with id: {}", feedback.getId());
        return feedbackMapper.toDTO(feedback);
    }
    
    @Transactional(readOnly = true)
    public List<EventFeedbackDTO> getEventFeedbacks(Integer eventId) {
        log.info("Getting feedbacks for event {}", eventId);
        
        List<EventFeedback> feedbacks = feedbackRepository.findByEventId(eventId);
        return feedbacks.stream()
            .map(feedback -> {
                EventFeedbackDTO dto = feedbackMapper.toDTO(feedback);
                // If feedback is anonymous, clear user information
                if (Boolean.TRUE.equals(dto.getAnonymous())) {
                    dto.setUserFirstName(null);
                    dto.setUserLastName(null);
                    dto.setUserImage(null);
                }
                return dto;
            })
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public EventFeedbackStatsDTO getEventFeedbackStats(Integer eventId) {
        log.info("Getting feedback stats for event {}", eventId);
        
        // Verify event exists
        eventRepository.findById(eventId)
            .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));
        
        EventFeedbackStatsDTO stats = new EventFeedbackStatsDTO(eventId);
        
        // Get total feedbacks
        Long totalFeedbacks = feedbackRepository.countByEventId(eventId);
        stats.setTotalFeedbacks(totalFeedbacks.intValue());
        
        if (totalFeedbacks == 0) {
            return stats;
        }
        
        // Get average rating
        Double averageRating = feedbackRepository.getAverageRatingByEventId(eventId);
        stats.setAverageRating(averageRating != null ? Math.round(averageRating * 10.0) / 10.0 : 0.0);
        
        // Get satisfaction rate (4-5 stars)
        Long satisfiedCount = feedbackRepository.countSatisfiedByEventId(eventId);
        double satisfactionRate = (satisfiedCount.doubleValue() / totalFeedbacks) * 100;
        stats.setSatisfactionRate(Math.round(satisfactionRate * 10.0) / 10.0);
        
        // Get rating distribution
        List<Object[]> distribution = feedbackRepository.getRatingDistributionByEventId(eventId);
        Map<Integer, Long> ratingDistribution = new HashMap<>();
        
        // Initialize all ratings with 0
        for (int i = 1; i <= 5; i++) {
            ratingDistribution.put(i, 0L);
        }
        
        // Fill with actual data
        for (Object[] row : distribution) {
            // Handle both Integer and Double types for backward compatibility
            Number ratingNumber = (Number) row[0];
            Integer rating = ratingNumber.intValue(); // Round to nearest integer for distribution
            Long count = (Long) row[1];
            
            // Only count ratings between 1 and 5
            if (rating >= 1 && rating <= 5) {
                ratingDistribution.put(rating, ratingDistribution.getOrDefault(rating, 0L) + count);
            }
        }
        
        stats.setRatingDistribution(ratingDistribution);
        
        return stats;
    }
    
    @Transactional(readOnly = true)
    public boolean hasUserGivenFeedback(Integer eventId, Long userId) {
        return feedbackRepository.existsByEventIdAndUserId(eventId, userId);
    }
    
    @Transactional(readOnly = true)
    public EventFeedbackDTO getUserFeedback(Integer eventId, Long userId) {
        EventFeedback feedback = feedbackRepository.findByEventIdAndUserId(eventId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Feedback not found"));
        return feedbackMapper.toDTO(feedback);
    }
    
    @Transactional
    public EventFeedbackDTO updateFeedback(Long feedbackId, EventFeedbackDTO feedbackDTO, Long userId) {
        log.info("Updating feedback {} by user {}", feedbackId, userId);
        
        EventFeedback feedback = feedbackRepository.findById(feedbackId)
            .orElseThrow(() -> new ResourceNotFoundException("Feedback not found with id: " + feedbackId));
        
        // Verify user owns this feedback
        if (!feedback.getUserId().equals(userId)) {
            throw new UnauthorizedException("You can only update your own feedback");
        }
        
        // Update fields
        feedback.setRating(feedbackDTO.getRating());
        feedback.setComment(feedbackDTO.getComment());
        feedback.setAnonymous(feedbackDTO.getAnonymous());
        
        feedback = feedbackRepository.save(feedback);
        
        log.info("Feedback updated successfully");
        return feedbackMapper.toDTO(feedback);
    }
    
    @Transactional
    public void deleteFeedback(Long feedbackId, Long userId) {
        log.info("Deleting feedback {} by user {}", feedbackId, userId);
        
        EventFeedback feedback = feedbackRepository.findById(feedbackId)
            .orElseThrow(() -> new ResourceNotFoundException("Feedback not found with id: " + feedbackId));
        
        // Verify user owns this feedback
        if (!feedback.getUserId().equals(userId)) {
            throw new UnauthorizedException("You can only delete your own feedback");
        }
        
        feedbackRepository.delete(feedback);
        log.info("Feedback deleted successfully");
    }
}
