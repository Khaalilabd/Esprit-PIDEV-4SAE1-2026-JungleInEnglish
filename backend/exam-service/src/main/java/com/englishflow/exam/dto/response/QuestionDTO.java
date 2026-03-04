package com.englishflow.exam.dto.response;

import com.englishflow.exam.enums.QuestionType;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionDTO {
    private String id;
    private QuestionType questionType;
    private String prompt;
    private String mediaUrl;
    private Integer orderIndex;
    private Double points;
    private String explanation;
    private JsonNode metadata;
    private List<OptionDTO> options;
}
