package com.englishflow.exam.dto.response;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavedAnswerDTO {
    private String id;
    private String questionId;
    private JsonNode answerData;
    private Boolean isCorrect;
    private Double score;
    private String manualFeedback;
    private LocalDateTime gradedAt;
    private Long gradedBy;
}
