package com.englishflow.exam.dto.request;

import com.englishflow.exam.enums.PartType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreatePartDTO {
    
    @NotBlank(message = "Title is required")
    private String title;
    
    @NotNull(message = "Part type is required")
    private PartType partType;
    
    private String instructions;
    private Integer orderIndex;
    private Integer timeLimit;
    private String audioUrl;
    private String readingText;
}
