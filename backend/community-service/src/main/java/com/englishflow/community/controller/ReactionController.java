package com.englishflow.community.controller;

import com.englishflow.community.dto.ReactionDTO;
import com.englishflow.community.entity.Reaction;
import com.englishflow.community.service.ReactionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/community/reactions")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Reactions", description = "Reaction management endpoints for posts and topics")
public class ReactionController {
    
    private final ReactionService reactionService;
    
    @PostMapping("/posts/{postId}")
    @Operation(summary = "Add reaction to post", description = "Add or update a reaction (LIKE, HELPFUL, INSIGHTFUL) to a post")
    public ResponseEntity<ReactionDTO> addReactionToPost(
            @PathVariable Long postId,
            @RequestParam Long userId,
            @RequestParam Reaction.ReactionType type) {
        ReactionDTO reaction = reactionService.addReactionToPost(postId, userId, type);
        return ResponseEntity.status(HttpStatus.CREATED).body(reaction);
    }
    
    @PostMapping("/topics/{topicId}")
    @Operation(summary = "Add reaction to topic", description = "Add or update a reaction to a topic")
    public ResponseEntity<ReactionDTO> addReactionToTopic(
            @PathVariable Long topicId,
            @RequestParam Long userId,
            @RequestParam Reaction.ReactionType type) {
        ReactionDTO reaction = reactionService.addReactionToTopic(topicId, userId, type);
        return ResponseEntity.status(HttpStatus.CREATED).body(reaction);
    }
    
    @DeleteMapping("/posts/{postId}")
    @Operation(summary = "Remove reaction from post", description = "Remove user's reaction from a post")
    public ResponseEntity<Void> removeReactionFromPost(
            @PathVariable Long postId,
            @RequestParam Long userId) {
        try {
            reactionService.removeReactionFromPost(postId, userId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Error removing reaction from post {}: {}", postId, e.getMessage());
            return ResponseEntity.noContent().build(); // Return 204 even on error
        }
    }
    
    @DeleteMapping("/topics/{topicId}")
    @Operation(summary = "Remove reaction from topic", description = "Remove user's reaction from a topic")
    public ResponseEntity<Void> removeReactionFromTopic(
            @PathVariable Long topicId,
            @RequestParam Long userId) {
        try {
            reactionService.removeReactionFromTopic(topicId, userId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Error removing reaction from topic {}: {}", topicId, e.getMessage());
            return ResponseEntity.noContent().build(); // Return 204 even on error
        }
    }
    
    @GetMapping("/posts/{postId}/count")
    @Operation(summary = "Get post reactions by type", description = "Get reactions count grouped by type for a post")
    public ResponseEntity<java.util.List<com.englishflow.community.dto.ReactionCountDTO>> getPostReactionsByType(@PathVariable Long postId) {
        java.util.List<com.englishflow.community.dto.ReactionCountDTO> counts = reactionService.getPostReactionsByType(postId);
        return ResponseEntity.ok(counts);
    }
    
    @GetMapping("/topics/{topicId}/count")
    @Operation(summary = "Get topic reactions by type", description = "Get reactions count grouped by type for a topic")
    public ResponseEntity<java.util.List<com.englishflow.community.dto.ReactionCountDTO>> getTopicReactionsByType(@PathVariable Long topicId) {
        java.util.List<com.englishflow.community.dto.ReactionCountDTO> counts = reactionService.getTopicReactionsByType(topicId);
        return ResponseEntity.ok(counts);
    }
    
    @GetMapping("/posts/{postId}/user/{userId}")
    @Operation(summary = "Get user reaction for post", description = "Get the current user's reaction for a post")
    public ResponseEntity<ReactionDTO> getUserReactionForPost(
            @PathVariable Long postId,
            @PathVariable Long userId) {
        try {
            java.util.Optional<ReactionDTO> reaction = reactionService.getUserReactionForPost(postId, userId);
            if (reaction.isPresent()) {
                return ResponseEntity.ok(reaction.get());
            } else {
                return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
            }
        } catch (Exception e) {
            log.error("Error getting user reaction for post {}: {}", postId, e.getMessage());
            return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
        }
    }
    
    @GetMapping("/topics/{topicId}/user/{userId}")
    @Operation(summary = "Get user reaction for topic", description = "Get the current user's reaction for a topic")
    public ResponseEntity<ReactionDTO> getUserReactionForTopic(
            @PathVariable Long topicId,
            @PathVariable Long userId) {
        try {
            java.util.Optional<ReactionDTO> reaction = reactionService.getUserReactionForTopic(topicId, userId);
            if (reaction.isPresent()) {
                return ResponseEntity.ok(reaction.get());
            } else {
                return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
            }
        } catch (Exception e) {
            log.error("Error getting user reaction for topic {}: {}", topicId, e.getMessage());
            return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
        }
    }
    
    @PostMapping("/recalculate-scores")
    @Operation(summary = "Recalculate all scores", description = "Manually recalculate weighted scores for all topics and posts")
    public ResponseEntity<String> recalculateAllScores() {
        try {
            reactionService.recalculateAllScores();
            return ResponseEntity.ok("All scores recalculated successfully");
        } catch (Exception e) {
            log.error("Error recalculating scores: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error recalculating scores: " + e.getMessage());
        }
    }
}
