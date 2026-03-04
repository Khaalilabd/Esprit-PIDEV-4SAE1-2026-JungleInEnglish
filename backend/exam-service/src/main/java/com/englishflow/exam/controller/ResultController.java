package com.englishflow.exam.controller;

import com.englishflow.exam.dto.response.ResultDTO;
import com.englishflow.exam.dto.response.ResultWithReviewDTO;
import com.englishflow.exam.service.IResultService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/exam-results")
@RequiredArgsConstructor
public class ResultController {
    
    private final IResultService resultService;
    
    @GetMapping("/attempt/{attemptId}")
    public ResponseEntity<ResultDTO> getResultByAttemptId(
            @PathVariable String attemptId,
            @RequestParam Long userId) {
        return ResponseEntity.ok(resultService.getResultByAttemptId(attemptId, userId));
    }
    
    @GetMapping("/attempt/{attemptId}/review")
    public ResponseEntity<ResultWithReviewDTO> getResultWithReview(
            @PathVariable String attemptId,
            @RequestParam Long userId) {
        return ResponseEntity.ok(resultService.getResultWithReview(attemptId, userId));
    }
    
    @GetMapping("/student/{userId}")
    public ResponseEntity<List<ResultDTO>> getUserResults(@PathVariable Long userId) {
        return ResponseEntity.ok(resultService.getUserResults(userId));
    }
}
