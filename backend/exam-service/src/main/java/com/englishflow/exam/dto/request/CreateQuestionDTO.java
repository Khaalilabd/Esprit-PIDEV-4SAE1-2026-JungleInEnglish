package com.englishflow.exam.dto.request;

import com.englishflow.exam.enums.QuestionType;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateQuestionDTO {
    
    @NotNull(message = "Question type is required")
    private QuestionType questionType;
    
    @NotBlank(message = "Prompt is required")
    private String prompt;
    
    private String mediaUrl;
    private Integer orderIndex;
    
    @NotNull(message = "Points is required")
    @Min(value = 0, message = "Points must be at least 0")
    private Double points;
    
    private String explanation;
    private JsonNode metadata;
    
    // Options for MULTIPLE_CHOICE, TRUE_FALSE, DROPDOWN_SELECT
    private List<CreateOptionDTO> options;
    
    // Correct answer data
    private CreateCorrectAnswerDTO correctAnswer;
}
