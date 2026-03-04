package com.englishflow.exam.service;

import com.englishflow.exam.dto.response.QuestionReviewDTO;
import com.englishflow.exam.dto.response.ResultDTO;
import com.englishflow.exam.dto.response.ResultWithReviewDTO;
import com.englishflow.exam.entity.*;
import com.englishflow.exam.enums.ExamLevel;
import com.englishflow.exam.repository.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResultService implements IResultService {
    
    private final ExamResultRepository resultRepository;
    private final StudentExamAttemptRepository attemptRepository;
    private final StudentAnswerRepository answerRepository;
    private final QuestionRepository questionRepository;
    private final CorrectAnswerRepository correctAnswerRepository;
    private final ObjectMapper objectMapper;
    
    @Override
    @Transactional
    public void generateResult(String attemptId) {
        StudentExamAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found"));
        
        // Check if result already exists
        if (resultRepository.findByAttemptId(attemptId).isPresent()) {
            return;
        }
        
        // Calculate part breakdown
        JsonNode partBreakdown = calculatePartBreakdown(attempt);
        
        // Determine CEFR band recommendation
        ExamLevel cefrBand = determineCEFRBand(attempt.getPercentageScore(), attempt.getExam().getLevel());
        
        ExamResult result = ExamResult.builder()
                .id(UUID.randomUUID().toString())
                .userId(attempt.getUserId())
                .attemptId(attemptId)
                .level(attempt.getExam().getLevel())
                .totalScore(attempt.getTotalScore())
                .percentageScore(attempt.getPercentageScore())
                .passed(attempt.getPassed())
                .partBreakdown(partBreakdown)
                .cefrBand(cefrBand)
                .createdAt(LocalDateTime.now())
                .build();
        
        resultRepository.save(result);
    }
    
    @Override
    @Transactional(readOnly = true)
    public ResultDTO getResultByAttemptId(String attemptId, Long userId) {
        ExamResult result = resultRepository.findByAttemptId(attemptId)
                .orElseThrow(() -> new RuntimeException("Result not found for attempt: " + attemptId));
        
        if (!result.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to result");
        }
        
        return mapToResultDTO(result);
    }
    
    @Override
    @Transactional(readOnly = true)
    public ResultWithReviewDTO getResultWithReview(String attemptId, Long userId) {
        ExamResult result = resultRepository.findByAttemptId(attemptId)
                .orElseThrow(() -> new RuntimeException("Result not found for attempt: " + attemptId));
        
        if (!result.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to result");
        }
        
        List<QuestionReviewDTO> reviews = generateQuestionReviews(attemptId);
        
        return ResultWithReviewDTO.builder()
                .id(result.getId())
                .userId(result.getUserId())
                .attemptId(result.getAttemptId())
                .level(result.getLevel())
                .totalScore(result.getTotalScore())
                .percentageScore(result.getPercentageScore())
                .passed(result.getPassed())
                .partBreakdown(result.getPartBreakdown())
                .cefrBand(result.getCefrBand())
                .certificate(result.getCertificate())
                .createdAt(result.getCreatedAt())
                .questionReviews(reviews)
                .build();
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ResultDTO> getUserResults(Long userId) {
        return resultRepository.findByUserId(userId).stream()
                .map(this::mapToResultDTO)
                .collect(Collectors.toList());
    }
    
    private JsonNode calculatePartBreakdown(StudentExamAttempt attempt) {
        ObjectNode breakdown = objectMapper.createObjectNode();
        
        List<StudentAnswer> answers = answerRepository.findByAttemptId(attempt.getId());
        Map<String, List<StudentAnswer>> answersByPart = new HashMap<>();
        
        for (StudentAnswer answer : answers) {
            Question question = questionRepository.findById(answer.getQuestionId()).orElse(null);
            if (question != null) {
                String partId = question.getPart().getId();
                answersByPart.computeIfAbsent(partId, k -> new ArrayList<>()).add(answer);
            }
        }
        
        answersByPart.forEach((partId, partAnswers) -> {
            double partScore = partAnswers.stream()
                    .mapToDouble(a -> a.getScore() != null ? a.getScore() : 0.0)
                    .sum();
            
            double partMaxScore = partAnswers.stream()
                    .mapToDouble(a -> {
                        Question q = questionRepository.findById(a.getQuestionId()).orElse(null);
                        return q != null ? q.getPoints() : 0.0;
                    })
                    .sum();
            
            ObjectNode partData = objectMapper.createObjectNode();
            partData.put("score", partScore);
            partData.put("maxScore", partMaxScore);
            partData.put("percentage", partMaxScore > 0 ? (partScore / partMaxScore) * 100 : 0);
            
            breakdown.set(partId, partData);
        });
        
        return breakdown;
    }
    
    private ExamLevel determineCEFRBand(Double percentageScore, ExamLevel attemptedLevel) {
        if (percentageScore == null) {
            return null;
        }
        
        // Simple band determination logic
        if (percentageScore >= 90) {
            return getNextLevel(attemptedLevel);
        } else if (percentageScore >= 70) {
            return attemptedLevel;
        } else if (percentageScore >= 50) {
            return getPreviousLevel(attemptedLevel);
        } else {
            return getPreviousLevel(getPreviousLevel(attemptedLevel));
        }
    }
    
    private ExamLevel getNextLevel(ExamLevel current) {
        return switch (current) {
            case A1 -> ExamLevel.A2;
            case A2 -> ExamLevel.B1;
            case B1 -> ExamLevel.B2;
            case B2 -> ExamLevel.C1;
            case C1, C2 -> ExamLevel.C2;
        };
    }
    
    private ExamLevel getPreviousLevel(ExamLevel current) {
        return switch (current) {
            case A1, A2 -> ExamLevel.A1;
            case B1 -> ExamLevel.A2;
            case B2 -> ExamLevel.B1;
            case C1 -> ExamLevel.B2;
            case C2 -> ExamLevel.C1;
        };
    }
    
    private List<QuestionReviewDTO> generateQuestionReviews(String attemptId) {
        List<StudentAnswer> answers = answerRepository.findByAttemptId(attemptId);
        
        return answers.stream()
                .map(this::mapToQuestionReview)
                .collect(Collectors.toList());
    }
    
    private QuestionReviewDTO mapToQuestionReview(StudentAnswer answer) {
        Question question = questionRepository.findById(answer.getQuestionId()).orElse(null);
        CorrectAnswer correctAnswer = correctAnswerRepository.findByQuestionId(answer.getQuestionId()).orElse(null);
        
        return QuestionReviewDTO.builder()
                .questionId(answer.getQuestionId())
                .questionType(question != null ? question.getQuestionType() : null)
                .prompt(question != null ? question.getPrompt() : null)
                .studentAnswer(answer.getAnswerData())
                .correctAnswer(correctAnswer != null ? correctAnswer.getAnswerData() : null)
                .isCorrect(answer.getIsCorrect())
                .score(answer.getScore())
                .maxPoints(question != null ? question.getPoints() : null)
                .explanation(question != null ? question.getExplanation() : null)
                .manualFeedback(answer.getManualFeedback())
                .build();
    }
    
    private ResultDTO mapToResultDTO(ExamResult result) {
        return ResultDTO.builder()
                .id(result.getId())
                .userId(result.getUserId())
                .attemptId(result.getAttemptId())
                .level(result.getLevel())
                .totalScore(result.getTotalScore())
                .percentageScore(result.getPercentageScore())
                .passed(result.getPassed())
                .partBreakdown(result.getPartBreakdown())
                .cefrBand(result.getCefrBand())
                .certificate(result.getCertificate())
                .createdAt(result.getCreatedAt())
                .build();
    }
}
