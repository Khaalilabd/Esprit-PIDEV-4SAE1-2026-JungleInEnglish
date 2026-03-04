package com.englishflow.exam.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateOptionDTO {
    
    @NotBlank(message = "Option label is required")
    private String label;
    
    private Integer orderIndex;
    private Boolean isCorrect;
}
