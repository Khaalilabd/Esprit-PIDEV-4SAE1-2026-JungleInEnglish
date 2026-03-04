package com.englishflow.exam.dto.response;

import com.englishflow.exam.enums.AttemptStatus;
import com.englishflow.exam.enums.GradingMode;
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
public class AttemptWithExamDTO {
    private String id;
    private Long userId;
    private ExamDetailDTO exam;
    private LocalDateTime startedAt;
    private LocalDateTime submittedAt;
    private AttemptStatus status;
    private Double totalScore;
    private Double percentageScore;
    private Boolean passed;
    private Integer timeSpent;
    private GradingMode gradingMode;
    private List<StudentAnswerDTO> answers;
}
