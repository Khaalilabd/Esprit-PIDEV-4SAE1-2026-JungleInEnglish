package com.englishflow.exam.service;

import com.englishflow.exam.dto.request.ManualGradeDTO;
import com.englishflow.exam.dto.response.GradingQueueItemDTO;

import java.util.List;

public interface IGradingService {
    
    void gradeAttempt(String attemptId);
    
    List<GradingQueueItemDTO> getGradingQueue();
    
    void manualGradeAnswer(String answerId, Long graderId, ManualGradeDTO dto);
    
    void finalizeAttemptGrading(String attemptId);
}
