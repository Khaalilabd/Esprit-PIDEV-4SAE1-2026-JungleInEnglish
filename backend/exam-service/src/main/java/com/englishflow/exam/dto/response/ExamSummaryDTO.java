package com.englishflow.exam.dto.response;

import com.englishflow.exam.enums.ExamLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamSummaryDTO {
    private String id;
    private String title;
    private ExamLevel level;
    private String description;
    private Integer totalDuration;
    private Double passingScore;
    private Boolean isPublished;
    private Integer partCount;
    private Integer questionCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
