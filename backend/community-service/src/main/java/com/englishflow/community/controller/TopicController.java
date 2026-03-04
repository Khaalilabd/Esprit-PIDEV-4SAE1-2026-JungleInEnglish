package com.englishflow.community.controller;

import com.englishflow.community.dto.CreateTopicRequest;
import com.englishflow.community.dto.TopicDTO;
import com.englishflow.community.service.PermissionService;
import com.englishflow.community.service.TopicService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/community/topics")
@RequiredArgsConstructor
@Tag(name = "Topics", description = "Topic management endpoints")
public class TopicController {
    
    private final TopicService topicService;
    private final PermissionService permissionService;
    
    @PostMapping
    @Operation(summary = "Create topic", description = "Create a new discussion topic")
    public ResponseEntity<TopicDTO> createTopic(
            @Valid @RequestBody CreateTopicRequest request,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "STUDENT") String userRole) {
        
        // Check if user has permission to create topic
        if (!permissionService.canCreateTopic(request.getSubCategoryId(), userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        TopicDTO topic = topicService.createTopic(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(topic);
    }
    
    @GetMapping("/subcategory/{subCategoryId}")
    @Operation(summary = "Get topics by subcategory", description = "Retrieve all topics for a specific subcategory with pagination and sorting")
    public ResponseEntity<Page<TopicDTO>> getTopicsBySubCategory(
            @PathVariable Long subCategoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "recent") String sortBy) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<TopicDTO> topics = topicService.getTopicsBySubCategory(subCategoryId, sortBy, pageable);
        return ResponseEntity.ok(topics);
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Get topic by ID", description = "Retrieve a specific topic and increment view count")
    public ResponseEntity<TopicDTO> getTopicById(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long currentUserId) {
        TopicDTO topic = topicService.getTopicById(id, currentUserId);
        return ResponseEntity.ok(topic);
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Update topic", description = "Update an existing topic")
    public ResponseEntity<TopicDTO> updateTopic(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody CreateTopicRequest request) {
        TopicDTO topic = topicService.updateTopic(id, userId, request);
        return ResponseEntity.ok(topic);
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete topic", description = "Delete a topic and all its posts")
    public ResponseEntity<Void> deleteTopic(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId) {
        topicService.deleteTopic(id, userId);
        return ResponseEntity.noContent().build();
    }
    
    @PutMapping("/{id}/pin")
    @Operation(summary = "Pin topic", description = "Pin a topic to the top of the list")
    public ResponseEntity<TopicDTO> pinTopic(@PathVariable Long id) {
        TopicDTO topic = topicService.pinTopic(id);
        return ResponseEntity.ok(topic);
    }
    
    @PutMapping("/{id}/unpin")
    @Operation(summary = "Unpin topic", description = "Remove pin from a topic")
    public ResponseEntity<TopicDTO> unpinTopic(@PathVariable Long id) {
        TopicDTO topic = topicService.unpinTopic(id);
        return ResponseEntity.ok(topic);
    }
    
    @PutMapping("/{id}/lock")
    @Operation(summary = "Lock topic", description = "Lock a topic to prevent new posts")
    public ResponseEntity<TopicDTO> lockTopic(@PathVariable Long id) {
        TopicDTO topic = topicService.lockTopic(id);
        return ResponseEntity.ok(topic);
    }
    
    @PutMapping("/{id}/unlock")
    @Operation(summary = "Unlock topic", description = "Unlock a topic to allow new posts")
    public ResponseEntity<TopicDTO> unlockTopic(@PathVariable Long id) {
        TopicDTO topic = topicService.unlockTopic(id);
        return ResponseEntity.ok(topic);
    }
}
