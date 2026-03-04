package com.englishflow.exam.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SaveAnswersDTO {
    
    @NotNull(message = "Answers list is required")
    @NotEmpty(message = "Answers list cannot be empty")
    private List<AnswerItemDTO> answers;
}
