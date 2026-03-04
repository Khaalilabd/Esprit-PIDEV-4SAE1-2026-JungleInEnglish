package com.englishflow.community.controller;

import com.englishflow.community.dto.TopicDTO;
import com.englishflow.community.service.TopicService;
import com.englishflow.community.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/community/moderation")
@RequiredArgsConstructor
@Tag(name = "Moderation", description = "Forum moderation endpoints")
public class ModerationController {
    
    private final TopicService topicService;
    private final CategoryService categoryService;
    
    @GetMapping("/topics")
    @Operation(summary = "Get all topics for moderation", description = "Get paginated list of all topics with filters")
    public ResponseEntity<Page<TopicDTO>> getAllTopicsForModeration(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long subCategoryId,
            @RequestParam(required = false) String status, // "pinned", "locked", "normal"
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("ASC") 
                ? Sort.by(sortBy).ascending() 
                : Sort.by(sortBy).descending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<TopicDTO> topics = topicService.getAllTopicsForModeration(categoryId, subCategoryId, status, search, pageable);
        return ResponseEntity.ok(topics);
    }
    
    @PostMapping("/topics/bulk-pin")
    @Operation(summary = "Pin multiple topics", description = "Pin multiple topics at once")
    public ResponseEntity<Map<String, Object>> bulkPinTopics(@RequestBody List<Long> topicIds) {
        int count = topicService.bulkPinTopics(topicIds);
        return ResponseEntity.ok(Map.of("success", true, "count", count));
    }
    
    @PostMapping("/topics/bulk-unpin")
    @Operation(summary = "Unpin multiple topics", description = "Unpin multiple topics at once")
    public ResponseEntity<Map<String, Object>> bulkUnpinTopics(@RequestBody List<Long> topicIds) {
        int count = topicService.bulkUnpinTopics(topicIds);
        return ResponseEntity.ok(Map.of("success", true, "count", count));
    }
    
    @PostMapping("/topics/bulk-lock")
    @Operation(summary = "Lock multiple topics", description = "Lock multiple topics at once")
    public ResponseEntity<Map<String, Object>> bulkLockTopics(@RequestBody List<Long> topicIds) {
        int count = topicService.bulkLockTopics(topicIds);
        return ResponseEntity.ok(Map.of("success", true, "count", count));
    }
    
    @PostMapping("/topics/bulk-unlock")
    @Operation(summary = "Unlock multiple topics", description = "Unlock multiple topics at once")
    public ResponseEntity<Map<String, Object>> bulkUnlockTopics(@RequestBody List<Long> topicIds) {
        int count = topicService.bulkUnlockTopics(topicIds);
        return ResponseEntity.ok(Map.of("success", true, "count", count));
    }
    
    @PostMapping("/topics/bulk-delete")
    @Operation(summary = "Delete multiple topics", description = "Delete multiple topics at once")
    public ResponseEntity<Map<String, Object>> bulkDeleteTopics(
            @RequestBody List<Long> topicIds,
            @RequestHeader("X-User-Id") Long userId) {
        int count = topicService.bulkDeleteTopics(topicIds, userId);
        return ResponseEntity.ok(Map.of("success", true, "count", count));
    }
    
    @PutMapping("/categories/{id}/lock")
    @Operation(summary = "Lock category", description = "Lock a category to prevent new topics/posts")
    public ResponseEntity<Map<String, Object>> lockCategory(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId) {
        categoryService.lockCategory(id, userId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Category locked"));
    }
    
    @PutMapping("/categories/{id}/unlock")
    @Operation(summary = "Unlock category", description = "Unlock a category")
    public ResponseEntity<Map<String, Object>> unlockCategory(@PathVariable Long id) {
        categoryService.unlockCategory(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Category unlocked"));
    }
    
    @GetMapping("/stats")
    @Operation(summary = "Get moderation statistics", description = "Get statistics for moderation dashboard")
    public ResponseEntity<Map<String, Object>> getModerationStats() {
        Map<String, Object> stats = topicService.getModerationStats();
        return ResponseEntity.ok(stats);
    }
}
