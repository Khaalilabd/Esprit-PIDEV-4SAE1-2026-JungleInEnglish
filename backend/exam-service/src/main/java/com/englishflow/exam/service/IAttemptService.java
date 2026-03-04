package com.englishflow.exam.service;

import com.englishflow.exam.dto.request.SaveAnswersDTO;
import com.englishflow.exam.dto.response.AttemptDTO;
import com.englishflow.exam.dto.response.AttemptWithExamDTO;
import com.englishflow.exam.enums.ExamLevel;

import java.util.List;

public interface IAttemptService {
    
    AttemptWithExamDTO startExam(Long userId, ExamLevel level);
    
    AttemptWithExamDTO getAttempt(String attemptId, Long userId);
    
    void saveAnswers(String attemptId, Long userId, SaveAnswersDTO dto);
    
    AttemptDTO submitExam(String attemptId, Long userId);
    
    List<AttemptDTO> getUserAttempts(Long userId);
    
    List<AttemptDTO> getAllSubmittedAttempts();
    
    List<AttemptDTO> getAttemptsByStatus(String status);
    
    void deleteAttempt(String attemptId, Long userId);
}
