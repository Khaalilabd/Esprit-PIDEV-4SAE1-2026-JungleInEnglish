package com.englishflow.exam.dto.request;

import com.englishflow.exam.enums.ExamLevel;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateExamDTO {
    
    @NotBlank(message = "Title is required")
    private String title;
    
    @NotNull(message = "Level is required")
    private ExamLevel level;
    
    private String description;
    
    @NotNull(message = "Total duration is required")
    @Min(value = 1, message = "Duration must be at least 1 minute")
    private Integer totalDuration;
    
    @NotNull(message = "Passing score is required")
    @Min(value = 0, message = "Passing score must be at least 0")
    @Max(value = 100, message = "Passing score cannot exceed 100")
    private Double passingScore;
}
