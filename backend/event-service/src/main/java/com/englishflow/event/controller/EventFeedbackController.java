package com.englishflow.event.controller;

import com.englishflow.event.dto.EventFeedbackDTO;
import com.englishflow.event.dto.EventFeedbackStatsDTO;
import com.englishflow.event.service.EventFeedbackService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/events/feedback")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Event Feedback", description = "Event feedback management APIs")
public class EventFeedbackController {
    
    private final EventFeedbackService feedbackService;
    
    @PostMapping
    @Operation(summary = "Create event feedback", description = "Submit feedback for an event")
    public ResponseEntity<EventFeedbackDTO> createFeedback(@Valid @RequestBody EventFeedbackDTO feedbackDTO) {
        log.info("REST request to create feedback for event: {}", feedbackDTO.getEventId());
        EventFeedbackDTO result = feedbackService.createFeedback(feedbackDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }
    
    @GetMapping("/event/{eventId}")
    @Operation(summary = "Get event feedbacks", description = "Get all feedbacks for an event")
    public ResponseEntity<List<EventFeedbackDTO>> getEventFeedbacks(@PathVariable Integer eventId) {
        log.info("REST request to get feedbacks for event: {}", eventId);
        List<EventFeedbackDTO> feedbacks = feedbackService.getEventFeedbacks(eventId);
        return ResponseEntity.ok(feedbacks);
    }
    
    @GetMapping("/event/{eventId}/stats")
    @Operation(summary = "Get event feedback statistics", description = "Get feedback statistics for an event")
    public ResponseEntity<EventFeedbackStatsDTO> getEventFeedbackStats(@PathVariable Integer eventId) {
        log.info("REST request to get feedback stats for event: {}", eventId);
        EventFeedbackStatsDTO stats = feedbackService.getEventFeedbackStats(eventId);
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/event/{eventId}/user/{userId}")
    @Operation(summary = "Get user feedback", description = "Get a specific user's feedback for an event")
    public ResponseEntity<EventFeedbackDTO> getUserFeedback(
            @PathVariable Integer eventId,
            @PathVariable Long userId) {
        log.info("REST request to get feedback for event {} by user {}", eventId, userId);
        EventFeedbackDTO feedback = feedbackService.getUserFeedback(eventId, userId);
        return ResponseEntity.ok(feedback);
    }
    
    @GetMapping("/event/{eventId}/user/{userId}/exists")
    @Operation(summary = "Check if user has given feedback", description = "Check if a user has already given feedback for an event")
    public ResponseEntity<Boolean> hasUserGivenFeedback(
            @PathVariable Integer eventId,
            @PathVariable Long userId) {
        log.info("REST request to check if user {} has given feedback for event {}", userId, eventId);
        boolean hasFeedback = feedbackService.hasUserGivenFeedback(eventId, userId);
        return ResponseEntity.ok(hasFeedback);
    }
    
    @PutMapping("/{feedbackId}/user/{userId}")
    @Operation(summary = "Update feedback", description = "Update an existing feedback")
    public ResponseEntity<EventFeedbackDTO> updateFeedback(
            @PathVariable Long feedbackId,
            @PathVariable Long userId,
            @Valid @RequestBody EventFeedbackDTO feedbackDTO) {
        log.info("REST request to update feedback: {}", feedbackId);
        EventFeedbackDTO result = feedbackService.updateFeedback(feedbackId, feedbackDTO, userId);
        return ResponseEntity.ok(result);
    }
    
    @DeleteMapping("/{feedbackId}/user/{userId}")
    @Operation(summary = "Delete feedback", description = "Delete a feedback")
    public ResponseEntity<Void> deleteFeedback(
            @PathVariable Long feedbackId,
            @PathVariable Long userId) {
        log.info("REST request to delete feedback: {}", feedbackId);
        feedbackService.deleteFeedback(feedbackId, userId);
        return ResponseEntity.noContent().build();
    }
}
