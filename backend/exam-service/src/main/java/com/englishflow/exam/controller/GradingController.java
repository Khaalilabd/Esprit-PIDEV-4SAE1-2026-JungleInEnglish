package com.englishflow.exam.controller;

import com.englishflow.exam.dto.request.ManualGradeDTO;
import com.englishflow.exam.dto.response.GradingQueueItemDTO;
import com.englishflow.exam.service.IGradingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/grading")
@RequiredArgsConstructor
public class GradingController {
    
    private final IGradingService gradingService;
    
    @GetMapping("/queue")
    public ResponseEntity<List<GradingQueueItemDTO>> getGradingQueue() {
        return ResponseEntity.ok(gradingService.getGradingQueue());
    }
    
    @GetMapping("/attempts/pending")
    public ResponseEntity<List<GradingQueueItemDTO>> getPendingAttempts() {
        return ResponseEntity.ok(gradingService.getGradingQueue());
    }
    
    @GetMapping("/attempts/{attemptId}/details")
    public ResponseEntity<GradingQueueItemDTO> getAttemptGradingDetails(@PathVariable String attemptId) {
        // This will be implemented to get full attempt details for grading
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/answers/{answerId}")
    public ResponseEntity<Void> manualGradeAnswer(
            @PathVariable String answerId,
            @RequestParam Long graderId,
            @Valid @RequestBody ManualGradeDTO dto) {
        gradingService.manualGradeAnswer(answerId, graderId, dto);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/attempts/{attemptId}/finalize")
    public ResponseEntity<Void> finalizeAttemptGrading(@PathVariable String attemptId) {
        gradingService.finalizeAttemptGrading(attemptId);
        return ResponseEntity.ok().build();
    }
}
