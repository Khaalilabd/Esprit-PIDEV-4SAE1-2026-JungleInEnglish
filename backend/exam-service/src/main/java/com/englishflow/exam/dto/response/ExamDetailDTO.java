package com.englishflow.exam.dto.response;

import com.englishflow.exam.enums.ExamLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamDetailDTO {
    private String id;
    private String title;
    private ExamLevel level;
    private String description;
    private Integer totalDuration;
    private Double passingScore;
    private Boolean isPublished;
    private List<PartDTO> parts;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
