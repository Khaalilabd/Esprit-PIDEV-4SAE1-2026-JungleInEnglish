package com.englishflow.courses.dto;

import com.englishflow.courses.enums.LessonType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LessonDTO {
    private Long id;
    private String title;
    private String description;
    private String content;
    private String contentUrl;
    private LessonType lessonType;
    private Integer orderIndex;
    private Integer duration;
    private Boolean isPreview;
    private Boolean isPublished;
    private Long chapterId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
