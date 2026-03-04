package com.englishflow.exam.dto.request;

import com.englishflow.exam.enums.ExamLevel;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateExamDTO {
    
    private String title;
    private ExamLevel level;
    private String description;
    
    @Min(value = 1, message = "Duration must be at least 1 minute")
    private Integer totalDuration;
    
    @Min(value = 0, message = "Passing score must be at least 0")
    @Max(value = 100, message = "Passing score cannot exceed 100")
    private Double passingScore;
}
