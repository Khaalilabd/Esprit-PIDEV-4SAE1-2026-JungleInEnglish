package com.englishflow.exam.dto.response;

import com.englishflow.exam.enums.AttemptStatus;
import com.englishflow.exam.enums.GradingMode;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttemptDTO {
    private String id;
    private Long userId;
    private String examId;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime startedAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime submittedAt;
    
    private AttemptStatus status;
    private Double totalScore;
    private Double percentageScore;
    private Boolean passed;
    private Integer timeSpent;
    private GradingMode gradingMode;
}
