package com.englishflow.exam.dto.response;

import com.englishflow.exam.enums.ExamLevel;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResultWithReviewDTO {
    private String id;
    private Long userId;
    private String attemptId;
    private ExamLevel level;
    private Double totalScore;
    private Double percentageScore;
    private Boolean passed;
    private JsonNode partBreakdown;
    private ExamLevel cefrBand;
    private String certificate;
    private LocalDateTime createdAt;
    private List<QuestionReviewDTO> questionReviews;
}
