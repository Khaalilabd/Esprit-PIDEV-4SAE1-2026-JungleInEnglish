package com.englishflow.community.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDTO {
    private Long id;
    private String name;
    private String description;
    private String icon;
    private String color;
    private Boolean isLocked;
    private Long lockedBy;
    private LocalDateTime lockedAt;
    private List<SubCategoryDTO> subCategories;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
