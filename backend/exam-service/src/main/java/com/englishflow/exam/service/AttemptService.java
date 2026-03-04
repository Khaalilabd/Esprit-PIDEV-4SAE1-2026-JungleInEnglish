package com.englishflow.exam.service;

import com.englishflow.exam.dto.request.SaveAnswersDTO;
import com.englishflow.exam.dto.response.AttemptDTO;
import com.englishflow.exam.dto.response.AttemptWithExamDTO;
import com.englishflow.exam.dto.response.ExamDetailDTO;
import com.englishflow.exam.dto.response.StudentAnswerDTO;
import com.englishflow.exam.entity.Exam;
import com.englishflow.exam.entity.StudentAnswer;
import com.englishflow.exam.entity.StudentExamAttempt;
import com.englishflow.exam.enums.AttemptStatus;
import com.englishflow.exam.enums.ExamLevel;
import com.englishflow.exam.enums.GradingMode;
import com.englishflow.exam.repository.ExamRepository;
import com.englishflow.exam.repository.StudentAnswerRepository;
import com.englishflow.exam.repository.StudentExamAttemptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttemptService implements IAttemptService {
    
    private final StudentExamAttemptRepository attemptRepository;
    private final ExamRepository examRepository;
    private final StudentAnswerRepository answerRepository;
    private final ExamService examService;
    private final GradingService gradingService;
    
    @Override
    @Transactional
    public AttemptWithExamDTO startExam(Long userId, ExamLevel level) {
        // Get all published exams for the level
        List<Exam> exams = examRepository.findByLevelAndIsPublished(level, true);
        
        if (exams.isEmpty()) {
            throw new RuntimeException("No published exams available for level: " + level);
        }
        
        // Randomly select one exam
        Exam selectedExam = exams.get(new Random().nextInt(exams.size()));
        
        // Create attempt
        StudentExamAttempt attempt = StudentExamAttempt.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId)
                .exam(selectedExam)
                .startedAt(LocalDateTime.now())
                .status(AttemptStatus.STARTED)
                .gradingMode(GradingMode.HYBRID)
                .build();
        
        StudentExamAttempt savedAttempt = attemptRepository.save(attempt);
        
        return mapToAttemptWithExamDTO(savedAttempt);
    }
    
    @Override
    @Transactional(readOnly = true)
    public AttemptWithExamDTO getAttempt(String attemptId, Long userId) {
        StudentExamAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found with id: " + attemptId));
        
        if (!attempt.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to attempt");
        }
        
        return mapToAttemptWithExamDTO(attempt);
    }
    
    @Override
    @Transactional
    public void saveAnswers(String attemptId, Long userId, SaveAnswersDTO dto) {
        StudentExamAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found with id: " + attemptId));
        
        if (!attempt.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to attempt");
        }
        
        if (attempt.getStatus() != AttemptStatus.STARTED) {
            throw new RuntimeException("Cannot save answers for attempt with status: " + attempt.getStatus());
        }
        
        // Save or update answers
        dto.getAnswers().forEach(answerItem -> {
            StudentAnswer existingAnswer = answerRepository
                    .findByAttemptIdAndQuestionId(attemptId, answerItem.getQuestionId())
                    .orElse(null);
            
            if (existingAnswer != null) {
                existingAnswer.setAnswerData(answerItem.getAnswerData());
                answerRepository.save(existingAnswer);
            } else {
                StudentAnswer newAnswer = StudentAnswer.builder()
                        .id(UUID.randomUUID().toString())
                        .attempt(attempt)
                        .questionId(answerItem.getQuestionId())
                        .answerData(answerItem.getAnswerData())
                        .build();
                answerRepository.save(newAnswer);
            }
        });
    }
    
    @Override
    @Transactional
    public AttemptDTO submitExam(String attemptId, Long userId) {
        StudentExamAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found with id: " + attemptId));
        
        if (!attempt.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to attempt");
        }
        
        if (attempt.getStatus() != AttemptStatus.STARTED) {
            throw new RuntimeException("Attempt already submitted or expired");
        }
        
        // Calculate time spent
        Duration duration = Duration.between(attempt.getStartedAt(), LocalDateTime.now());
        attempt.setTimeSpent((int) duration.toMinutes());
        attempt.setSubmittedAt(LocalDateTime.now());
        attempt.setStatus(AttemptStatus.SUBMITTED);
        
        attemptRepository.save(attempt);
        
        // Trigger auto-grading
        gradingService.gradeAttempt(attemptId);
        
        // Reload attempt to get updated scores
        attempt = attemptRepository.findById(attemptId).orElseThrow();
        
        return mapToAttemptDTO(attempt);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<AttemptDTO> getUserAttempts(Long userId) {
        return attemptRepository.findByUserId(userId).stream()
                .map(this::mapToAttemptDTO)
                .collect(Collectors.toList());
    }
    
    private AttemptDTO mapToAttemptDTO(StudentExamAttempt attempt) {
        return AttemptDTO.builder()
                .id(attempt.getId())
                .userId(attempt.getUserId())
                .examId(attempt.getExam().getId())
                .startedAt(attempt.getStartedAt())
                .submittedAt(attempt.getSubmittedAt())
                .status(attempt.getStatus())
                .totalScore(attempt.getTotalScore())
                .percentageScore(attempt.getPercentageScore())
                .passed(attempt.getPassed())
                .timeSpent(attempt.getTimeSpent())
                .gradingMode(attempt.getGradingMode())
                .build();
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<AttemptDTO> getAllSubmittedAttempts() {
        List<StudentExamAttempt> attempts = attemptRepository.findByStatus(AttemptStatus.SUBMITTED);
        attempts.addAll(attemptRepository.findByStatus(AttemptStatus.GRADED));
        return attempts.stream()
                .map(this::mapToAttemptDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<AttemptDTO> getAttemptsByStatus(String status) {
        AttemptStatus attemptStatus = AttemptStatus.valueOf(status.toUpperCase());
        return attemptRepository.findByStatus(attemptStatus).stream()
                .map(this::mapToAttemptDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public void deleteAttempt(String attemptId, Long userId) {
        StudentExamAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found with id: " + attemptId));
        
        if (!attempt.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to attempt");
        }
        
        if (attempt.getStatus() != AttemptStatus.STARTED) {
            throw new RuntimeException("Cannot delete attempt with status: " + attempt.getStatus());
        }
        
        // Delete all answers first
        answerRepository.deleteByAttemptId(attemptId);
        
        // Delete the attempt
        attemptRepository.delete(attempt);
    }
    
    private AttemptWithExamDTO mapToAttemptWithExamDTO(StudentExamAttempt attempt) {
        ExamDetailDTO examDTO = examService.getExamById(attempt.getExam().getId());
        
        // Get all answers for this attempt
        List<StudentAnswer> answers = answerRepository.findByAttemptId(attempt.getId());
        List<StudentAnswerDTO> answerDTOs = answers.stream()
                .map(this::mapToStudentAnswerDTO)
                .collect(Collectors.toList());
        
        return AttemptWithExamDTO.builder()
                .id(attempt.getId())
                .userId(attempt.getUserId())
                .exam(examDTO)
                .startedAt(attempt.getStartedAt())
                .submittedAt(attempt.getSubmittedAt())
                .status(attempt.getStatus())
                .totalScore(attempt.getTotalScore())
                .percentageScore(attempt.getPercentageScore())
                .passed(attempt.getPassed())
                .timeSpent(attempt.getTimeSpent())
                .gradingMode(attempt.getGradingMode())
                .answers(answerDTOs)
                .build();
    }
    
    private StudentAnswerDTO mapToStudentAnswerDTO(StudentAnswer answer) {
        return StudentAnswerDTO.builder()
                .id(answer.getId())
                .attemptId(answer.getAttempt().getId())
                .questionId(answer.getQuestionId()) // Keep as String
                .answerData(answer.getAnswerData() != null ? answer.getAnswerData().toString() : null)
                .score(answer.getScore())
                .feedback(answer.getManualFeedback())
                .isGraded(answer.getScore() != null)
                .graderId(answer.getGradedBy())
                .gradedAt(answer.getGradedAt())
                .answeredAt(null) // Not tracked in current entity
                .build();
    }
}
