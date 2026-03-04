package com.englishflow.exam.dto.response;

import com.englishflow.exam.enums.QuestionType;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionReviewDTO {
    private String questionId;
    private QuestionType questionType;
    private String prompt;
    private JsonNode studentAnswer;
    private JsonNode correctAnswer;
    private Boolean isCorrect;
    private Double score;
    private Double maxPoints;
    private String explanation;
    private String manualFeedback;
}
