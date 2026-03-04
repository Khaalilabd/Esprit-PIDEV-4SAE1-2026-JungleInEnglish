package com.englishflow.exam.controller;

import com.englishflow.exam.dto.request.CreateQuestionDTO;
import com.englishflow.exam.entity.CorrectAnswer;
import com.englishflow.exam.entity.ExamPart;
import com.englishflow.exam.entity.Question;
import com.englishflow.exam.entity.QuestionOption;
import com.englishflow.exam.repository.CorrectAnswerRepository;
import com.englishflow.exam.repository.ExamPartRepository;
import com.englishflow.exam.repository.QuestionOptionRepository;
import com.englishflow.exam.repository.QuestionRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/questions")
@RequiredArgsConstructor
public class QuestionController {
    
    private final QuestionRepository questionRepository;
    private final ExamPartRepository partRepository;
    private final QuestionOptionRepository optionRepository;
    private final CorrectAnswerRepository correctAnswerRepository;
    
    @PostMapping("/part/{partId}")
    @Transactional
    public ResponseEntity<Question> createQuestion(
            @PathVariable String partId,
            @Valid @RequestBody CreateQuestionDTO dto) {
        ExamPart part = partRepository.findById(partId)
                .orElseThrow(() -> new RuntimeException("Part not found"));
        
        Question question = Question.builder()
                .id(UUID.randomUUID().toString())
                .part(part)
                .questionType(dto.getQuestionType())
                .prompt(dto.getPrompt())
                .mediaUrl(dto.getMediaUrl())
                .orderIndex(dto.getOrderIndex() != null ? dto.getOrderIndex() : 0)
                .points(dto.getPoints())
                .explanation(dto.getExplanation())
                .metadata(dto.getMetadata())
                .build();
        
        Question savedQuestion = questionRepository.save(question);
        
        // Save options if provided
        if (dto.getOptions() != null && !dto.getOptions().isEmpty()) {
            dto.getOptions().forEach(optionDTO -> {
                QuestionOption option = QuestionOption.builder()
                        .id(UUID.randomUUID().toString())
                        .question(savedQuestion)
                        .label(optionDTO.getLabel())
                        .orderIndex(optionDTO.getOrderIndex() != null ? optionDTO.getOrderIndex() : 0)
                        .isCorrect(optionDTO.getIsCorrect() != null ? optionDTO.getIsCorrect() : false)
                        .build();
                optionRepository.save(option);
            });
        }
        
        // Save correct answer if provided
        if (dto.getCorrectAnswer() != null) {
            CorrectAnswer correctAnswer = CorrectAnswer.builder()
                    .id(UUID.randomUUID().toString())
                    .questionId(savedQuestion.getId())
                    .answerData(dto.getCorrectAnswer().getAnswerData())
                    .build();
            correctAnswerRepository.save(correctAnswer);
        }
        
        return ResponseEntity.status(HttpStatus.CREATED).body(savedQuestion);
    }
    
    @PutMapping("/{questionId}")
    @Transactional
    public ResponseEntity<Question> updateQuestion(
            @PathVariable String questionId,
            @Valid @RequestBody CreateQuestionDTO dto) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found"));
        
        question.setQuestionType(dto.getQuestionType());
        question.setPrompt(dto.getPrompt());
        question.setMediaUrl(dto.getMediaUrl());
        if (dto.getOrderIndex() != null) {
            question.setOrderIndex(dto.getOrderIndex());
        }
        question.setPoints(dto.getPoints());
        question.setExplanation(dto.getExplanation());
        question.setMetadata(dto.getMetadata());
        
        Question updated = questionRepository.save(question);
        
        // Update options if provided
        if (dto.getOptions() != null) {
            // Delete existing options
            optionRepository.deleteByQuestionId(questionId);
            
            // Create new options
            dto.getOptions().forEach(optionDTO -> {
                QuestionOption option = QuestionOption.builder()
                        .id(UUID.randomUUID().toString())
                        .question(updated)
                        .label(optionDTO.getLabel())
                        .orderIndex(optionDTO.getOrderIndex() != null ? optionDTO.getOrderIndex() : 0)
                        .isCorrect(optionDTO.getIsCorrect() != null ? optionDTO.getIsCorrect() : false)
                        .build();
                optionRepository.save(option);
            });
        }
        
        // Update correct answer if provided
        if (dto.getCorrectAnswer() != null) {
            CorrectAnswer correctAnswer = correctAnswerRepository.findByQuestionId(questionId)
                    .orElse(CorrectAnswer.builder()
                            .id(UUID.randomUUID().toString())
                            .questionId(questionId)
                            .build());
            correctAnswer.setAnswerData(dto.getCorrectAnswer().getAnswerData());
            correctAnswerRepository.save(correctAnswer);
        }
        
        return ResponseEntity.ok(updated);
    }
    
    @DeleteMapping("/{questionId}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable String questionId) {
        if (!questionRepository.existsById(questionId)) {
            throw new RuntimeException("Question not found");
        }
        questionRepository.deleteById(questionId);
        return ResponseEntity.noContent().build();
    }
}
