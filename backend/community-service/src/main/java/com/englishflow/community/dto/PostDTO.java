package com.englishflow.community.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostDTO {
    private Long id;
    private String content;
    private Long userId;
    private String userName;
    private Long topicId;
    private Integer reactionsCount;
    private Integer likeCount;
    private Integer insightfulCount;
    private Integer helpfulCount;
    private Integer weightedScore;
    private Boolean isTrending;
    private Boolean isAccepted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
