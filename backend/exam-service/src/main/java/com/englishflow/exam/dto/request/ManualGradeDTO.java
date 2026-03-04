package com.englishflow.exam.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ManualGradeDTO {
    
    @NotNull(message = "Score is required")
    @Min(value = 0, message = "Score must be at least 0")
    private Double score;
    
    private String feedback;
}
