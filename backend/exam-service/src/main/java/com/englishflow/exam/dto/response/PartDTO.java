package com.englishflow.exam.dto.response;

import com.englishflow.exam.enums.PartType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PartDTO {
    private String id;
    private String title;
    private PartType partType;
    private String instructions;
    private Integer orderIndex;
    private Integer timeLimit;
    private String audioUrl;
    private String readingText;
    private List<QuestionDTO> questions;
}
