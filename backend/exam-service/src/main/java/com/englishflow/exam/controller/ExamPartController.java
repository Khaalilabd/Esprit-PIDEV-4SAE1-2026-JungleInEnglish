package com.englishflow.exam.controller;

import com.englishflow.exam.dto.request.CreatePartDTO;
import com.englishflow.exam.entity.Exam;
import com.englishflow.exam.entity.ExamPart;
import com.englishflow.exam.repository.ExamPartRepository;
import com.englishflow.exam.repository.ExamRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/exam-parts")
@RequiredArgsConstructor
public class ExamPartController {
    
    private final ExamPartRepository partRepository;
    private final ExamRepository examRepository;
    
    @PostMapping("/exam/{examId}")
    public ResponseEntity<ExamPart> createPart(
            @PathVariable String examId,
            @Valid @RequestBody CreatePartDTO dto) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("Exam not found"));
        
        ExamPart part = ExamPart.builder()
                .id(UUID.randomUUID().toString())
                .exam(exam)
                .title(dto.getTitle())
                .partType(dto.getPartType())
                .instructions(dto.getInstructions())
                .orderIndex(dto.getOrderIndex() != null ? dto.getOrderIndex() : 0)
                .timeLimit(dto.getTimeLimit())
                .audioUrl(dto.getAudioUrl())
                .readingText(dto.getReadingText())
                .build();
        
        ExamPart saved = partRepository.save(part);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
    
    @PutMapping("/{partId}")
    public ResponseEntity<ExamPart> updatePart(
            @PathVariable String partId,
            @Valid @RequestBody CreatePartDTO dto) {
        ExamPart part = partRepository.findById(partId)
                .orElseThrow(() -> new RuntimeException("Part not found"));
        
        part.setTitle(dto.getTitle());
        part.setPartType(dto.getPartType());
        part.setInstructions(dto.getInstructions());
        if (dto.getOrderIndex() != null) {
            part.setOrderIndex(dto.getOrderIndex());
        }
        part.setTimeLimit(dto.getTimeLimit());
        part.setAudioUrl(dto.getAudioUrl());
        part.setReadingText(dto.getReadingText());
        
        ExamPart updated = partRepository.save(part);
        return ResponseEntity.ok(updated);
    }
    
    @DeleteMapping("/{partId}")
    public ResponseEntity<Void> deletePart(@PathVariable String partId) {
        if (!partRepository.existsById(partId)) {
            throw new RuntimeException("Part not found");
        }
        partRepository.deleteById(partId);
        return ResponseEntity.noContent().build();
    }
}
