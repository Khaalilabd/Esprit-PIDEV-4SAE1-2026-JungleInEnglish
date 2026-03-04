package com.englishflow.exam.service;

import com.englishflow.exam.dto.request.CreateExamDTO;
import com.englishflow.exam.dto.request.UpdateExamDTO;
import com.englishflow.exam.dto.response.ExamDetailDTO;
import com.englishflow.exam.dto.response.ExamSummaryDTO;
import com.englishflow.exam.enums.ExamLevel;

import java.util.List;

public interface IExamService {
    
    ExamSummaryDTO createExam(CreateExamDTO dto);
    
    ExamDetailDTO getExamById(String id);
    
    List<ExamSummaryDTO> getAllExams();
    
    List<ExamSummaryDTO> getPublishedExams(ExamLevel level);
    
    ExamSummaryDTO updateExam(String id, UpdateExamDTO dto);
    
    void deleteExam(String id);
    
    void publishExam(String id);
    
    void unpublishExam(String id);
}
