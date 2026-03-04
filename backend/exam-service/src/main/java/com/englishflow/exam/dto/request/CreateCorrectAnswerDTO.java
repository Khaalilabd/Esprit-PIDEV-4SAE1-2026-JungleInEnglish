package com.englishflow.exam.dto.request;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateCorrectAnswerDTO {
    
    @NotNull(message = "Answer data is required")
    private JsonNode answerData;
}
