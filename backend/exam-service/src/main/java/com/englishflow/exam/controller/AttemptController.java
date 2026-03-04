package com.englishflow.exam.controller;

import com.englishflow.exam.dto.request.SaveAnswersDTO;
import com.englishflow.exam.dto.response.AttemptDTO;
import com.englishflow.exam.dto.response.AttemptWithExamDTO;
import com.englishflow.exam.enums.ExamLevel;
import com.englishflow.exam.service.IAttemptService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/exam-attempts")
@RequiredArgsConstructor
public class AttemptController {
    
    private final IAttemptService attemptService;
    
    @PostMapping("/start")
    public ResponseEntity<AttemptWithExamDTO> startExam(
            @RequestParam Long userId,
            @RequestParam ExamLevel level) {
        AttemptWithExamDTO attempt = attemptService.startExam(userId, level);
        return ResponseEntity.status(HttpStatus.CREATED).body(attempt);
    }
    
    @GetMapping("/{attemptId}")
    public ResponseEntity<AttemptWithExamDTO> getAttempt(
            @PathVariable String attemptId,
            @RequestParam Long userId) {
        return ResponseEntity.ok(attemptService.getAttempt(attemptId, userId));
    }
    
    @PostMapping("/{attemptId}/answers")
    public ResponseEntity<Void> saveAnswers(
            @PathVariable String attemptId,
            @RequestParam Long userId,
            @Valid @RequestBody SaveAnswersDTO dto) {
        attemptService.saveAnswers(attemptId, userId, dto);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/{attemptId}/submit")
    public ResponseEntity<AttemptDTO> submitExam(
            @PathVariable String attemptId,
            @RequestParam Long userId) {
        return ResponseEntity.ok(attemptService.submitExam(attemptId, userId));
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<AttemptDTO>> getUserAttempts(@PathVariable Long userId) {
        return ResponseEntity.ok(attemptService.getUserAttempts(userId));
    }
    
    @GetMapping("/submitted")
    public ResponseEntity<List<AttemptDTO>> getAllSubmittedAttempts() {
        return ResponseEntity.ok(attemptService.getAllSubmittedAttempts());
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<List<AttemptDTO>> getAttemptsByStatus(@PathVariable String status) {
        return ResponseEntity.ok(attemptService.getAttemptsByStatus(status));
    }
    
    @DeleteMapping("/{attemptId}")
    public ResponseEntity<Void> deleteAttempt(
            @PathVariable String attemptId,
            @RequestParam Long userId) {
        attemptService.deleteAttempt(attemptId, userId);
        return ResponseEntity.noContent().build();
    }
}
