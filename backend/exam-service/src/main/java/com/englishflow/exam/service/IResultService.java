package com.englishflow.exam.service;

import com.englishflow.exam.dto.response.ResultDTO;
import com.englishflow.exam.dto.response.ResultWithReviewDTO;

import java.util.List;

public interface IResultService {
    
    void generateResult(String attemptId);
    
    ResultDTO getResultByAttemptId(String attemptId, Long userId);
    
    ResultWithReviewDTO getResultWithReview(String attemptId, Long userId);
    
    List<ResultDTO> getUserResults(Long userId);
}
