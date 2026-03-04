package com.englishflow.exam.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OptionDTO {
    private String id;
    private String label;
    private Integer orderIndex;
    private Boolean isCorrect; // Included for grading purposes
}
