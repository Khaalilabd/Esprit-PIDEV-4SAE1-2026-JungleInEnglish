package com.englishflow.exam.service;

import com.englishflow.exam.dto.request.ManualGradeDTO;
import com.englishflow.exam.dto.response.GradingQueueItemDTO;
import com.englishflow.exam.entity.CorrectAnswer;
import com.englishflow.exam.entity.Question;
import com.englishflow.exam.entity.StudentAnswer;
import com.englishflow.exam.entity.StudentExamAttempt;
import com.englishflow.exam.enums.AttemptStatus;
import com.englishflow.exam.enums.QuestionType;
import com.englishflow.exam.repository.CorrectAnswerRepository;
import com.englishflow.exam.repository.QuestionRepository;
import com.englishflow.exam.repository.StudentAnswerRepository;
import com.englishflow.exam.repository.StudentExamAttemptRepository;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GradingService implements IGradingService {
    
    private final StudentExamAttemptRepository attemptRepository;
    private final StudentAnswerRepository answerRepository;
    private final QuestionRepository questionRepository;
    private final CorrectAnswerRepository correctAnswerRepository;
    private final ResultService resultService;
    
    @Override
    @Transactional
    public void gradeAttempt(String attemptId) {
        StudentExamAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found"));
        
        List<StudentAnswer> answers = answerRepository.findByAttemptId(attemptId);
        
        for (StudentAnswer answer : answers) {
            Question question = questionRepository.findById(answer.getQuestionId())
                    .orElseThrow(() -> new RuntimeException("Question not found"));
            
            // Auto-grade if possible
            if (canAutoGrade(question.getQuestionType())) {
                autoGradeAnswer(answer, question);
            }
        }
        
        // Check if all answers are graded
        boolean allGraded = answers.stream().allMatch(a -> a.getScore() != null);
        
        if (allGraded) {
            finalizeAttemptGrading(attemptId);
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<GradingQueueItemDTO> getGradingQueue() {
        List<StudentAnswer> ungradedAnswers = answerRepository.findByIsCorrectIsNull();
        
        // ✅ OPTIMIZED: Fetch all questions at once
        List<Long> questionIds = ungradedAnswers.stream()
                .map(StudentAnswer::getQuestionId)
                .distinct()
                .collect(Collectors.toList());
        
        List<Question> questions = questionRepository.findAllById(questionIds);
        var questionMap = questions.stream()
                .collect(Collectors.toMap(Question::getId, q -> q));
        
        return ungradedAnswers.stream()
                .map(answer -> mapToGradingQueueItem(answer, questionMap))
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public void manualGradeAnswer(String answerId, Long graderId, ManualGradeDTO dto) {
        StudentAnswer answer = answerRepository.findById(answerId)
                .orElseThrow(() -> new RuntimeException("Answer not found"));
        
        Question question = questionRepository.findById(answer.getQuestionId())
                .orElseThrow(() -> new RuntimeException("Question not found"));
        
        answer.setScore(dto.getScore());
        answer.setManualFeedback(dto.getFeedback());
        answer.setGradedAt(LocalDateTime.now());
        answer.setGradedBy(graderId);
        answer.setIsCorrect(dto.getScore() >= question.getPoints());
        
        answerRepository.save(answer);
        
        // Check if all answers for this attempt are now graded
        String attemptId = answer.getAttempt().getId();
        List<StudentAnswer> allAnswers = answerRepository.findByAttemptId(attemptId);
        boolean allGraded = allAnswers.stream().allMatch(a -> a.getScore() != null);
        
        if (allGraded) {
            finalizeAttemptGrading(attemptId);
        }
    }
    
    @Override
    @Transactional
    public void finalizeAttemptGrading(String attemptId) {
        StudentExamAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found"));
        
        List<StudentAnswer> answers = answerRepository.findByAttemptId(attemptId);
        
        // ✅ OPTIMIZED: Fetch all questions at once instead of one by one
        List<Long> questionIds = answers.stream()
                .map(StudentAnswer::getQuestionId)
                .collect(Collectors.toList());
        
        List<Question> questions = questionRepository.findAllById(questionIds);
        
        // Create a map for quick lookup
        var questionMap = questions.stream()
                .collect(Collectors.toMap(Question::getId, q -> q));
        
        // Calculate total score
        double totalScore = answers.stream()
                .mapToDouble(a -> a.getScore() != null ? a.getScore() : 0.0)
                .sum();
        
        // Calculate max possible score using the map
        double maxScore = answers.stream()
                .mapToDouble(a -> {
                    Question q = questionMap.get(a.getQuestionId());
                    return q != null ? q.getPoints() : 0.0;
                })
                .sum();
        
        double percentageScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
        boolean passed = percentageScore >= attempt.getExam().getPassingScore();
        
        attempt.setTotalScore(totalScore);
        attempt.setPercentageScore(percentageScore);
        attempt.setPassed(passed);
        attempt.setStatus(AttemptStatus.GRADED);
        
        attemptRepository.save(attempt);
        
        // Generate result
        resultService.generateResult(attemptId);
    }
    
    private boolean canAutoGrade(QuestionType type) {
        return type == QuestionType.MULTIPLE_CHOICE ||
               type == QuestionType.TRUE_FALSE ||
               type == QuestionType.FILL_IN_GAP ||
               type == QuestionType.WORD_ORDERING ||
               type == QuestionType.MATCHING ||
               type == QuestionType.DROPDOWN_SELECT;
    }
    
    private void autoGradeAnswer(StudentAnswer answer, Question question) {
        CorrectAnswer correctAnswer = correctAnswerRepository.findByQuestionId(question.getId())
                .orElse(null);
        
        if (correctAnswer == null) {
            return;
        }
        
        JsonNode studentAnswerData = answer.getAnswerData();
        JsonNode correctAnswerData = correctAnswer.getAnswerData();
        
        boolean isCorrect = false;
        double score = 0.0;
        
        switch (question.getQuestionType()) {
            case MULTIPLE_CHOICE:
            case TRUE_FALSE:
            case DROPDOWN_SELECT:
                isCorrect = studentAnswerData.equals(correctAnswerData);
                score = isCorrect ? question.getPoints() : 0.0;
                break;
                
            case FILL_IN_GAP:
                isCorrect = compareFillInGap(studentAnswerData, correctAnswerData);
                score = isCorrect ? question.getPoints() : 0.0;
                break;
                
            case WORD_ORDERING:
                isCorrect = studentAnswerData.equals(correctAnswerData);
                score = isCorrect ? question.getPoints() : 0.0;
                break;
                
            case MATCHING:
                score = gradeMatching(studentAnswerData, correctAnswerData, question.getPoints());
                isCorrect = score >= question.getPoints();
                break;
        }
        
        answer.setIsCorrect(isCorrect);
        answer.setScore(score);
        answer.setGradedAt(LocalDateTime.now());
        
        answerRepository.save(answer);
    }
    
    private boolean compareFillInGap(JsonNode student, JsonNode correct) {
        if (student.isTextual() && correct.isTextual()) {
            String studentText = student.asText().trim().toLowerCase();
            String correctText = correct.asText().trim().toLowerCase();
            return studentText.equals(correctText);
        }
        return student.equals(correct);
    }
    
    private double gradeMatching(JsonNode student, JsonNode correct, double maxPoints) {
        if (!student.isObject() || !correct.isObject()) {
            return 0.0;
        }
        
        int totalPairs = correct.size();
        final int[] correctPairsArray = {0};
        
        correct.fields().forEachRemaining(entry -> {
            String key = entry.getKey();
            JsonNode correctValue = entry.getValue();
            JsonNode studentValue = student.get(key);
            
            if (studentValue != null && studentValue.equals(correctValue)) {
                correctPairsArray[0]++;
            }
        });
        
        int correctPairs = correctPairsArray[0];
        return totalPairs > 0 ? (correctPairs / (double) totalPairs) * maxPoints : 0.0;
    }
    
    private GradingQueueItemDTO mapToGradingQueueItem(StudentAnswer answer, java.util.Map<Long, Question> questionMap) {
        Question question = questionMap.get(answer.getQuestionId());
        
        return GradingQueueItemDTO.builder()
                .answerId(answer.getId())
                .attemptId(answer.getAttempt().getId())
                .userId(answer.getAttempt().getUserId())
                .questionId(answer.getQuestionId())
                .questionType(question != null ? question.getQuestionType() : null)
                .prompt(question != null ? question.getPrompt() : null)
                .studentAnswer(answer.getAnswerData())
                .maxPoints(question != null ? question.getPoints() : null)
                .submittedAt(answer.getAttempt().getSubmittedAt())
                .build();
    }
}
