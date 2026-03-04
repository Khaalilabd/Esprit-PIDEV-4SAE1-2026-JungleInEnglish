package com.englishflow.exam.dto.response;

import com.englishflow.exam.enums.QuestionType;
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
public class GradingQueueItemDTO {
    private String answerId;
    private String attemptId;
    private Long userId;
    private String questionId;
    private QuestionType questionType;
    private String prompt;
    private JsonNode studentAnswer;
    private Double maxPoints;
    private LocalDateTime submittedAt;
}
