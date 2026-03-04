package com.englishflow.exam.controller;

import com.englishflow.exam.dto.request.CreateExamDTO;
import com.englishflow.exam.dto.request.UpdateExamDTO;
import com.englishflow.exam.dto.response.ExamDetailDTO;
import com.englishflow.exam.dto.response.ExamSummaryDTO;
import com.englishflow.exam.enums.ExamLevel;
import com.englishflow.exam.service.IExamService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/exams")
@RequiredArgsConstructor
public class ExamController {
    
    private final IExamService examService;
    
    @PostMapping
    public ResponseEntity<ExamSummaryDTO> createExam(@Valid @RequestBody CreateExamDTO dto) {
        ExamSummaryDTO created = examService.createExam(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
    
    @GetMapping
    public ResponseEntity<List<ExamSummaryDTO>> getAllExams() {
        return ResponseEntity.ok(examService.getAllExams());
    }
    
    @GetMapping("/published")
    public ResponseEntity<List<ExamSummaryDTO>> getPublishedExams(
            @RequestParam(required = false) ExamLevel level) {
        return ResponseEntity.ok(examService.getPublishedExams(level));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ExamDetailDTO> getExamById(@PathVariable String id) {
        return ResponseEntity.ok(examService.getExamById(id));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ExamSummaryDTO> updateExam(
            @PathVariable String id,
            @Valid @RequestBody UpdateExamDTO dto) {
        return ResponseEntity.ok(examService.updateExam(id, dto));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExam(@PathVariable String id) {
        examService.deleteExam(id);
        return ResponseEntity.noContent().build();
    }
    
    @PutMapping("/{id}/publish")
    public ResponseEntity<Void> publishExam(@PathVariable String id) {
        examService.publishExam(id);
        return ResponseEntity.ok().build();
    }
    
    @PutMapping("/{id}/unpublish")
    public ResponseEntity<Void> unpublishExam(@PathVariable String id) {
        examService.unpublishExam(id);
        return ResponseEntity.ok().build();
    }
}
