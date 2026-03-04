package com.englishflow.courses.dto;

import com.englishflow.courses.enums.PackStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PackDTO {
    private Long id;
    private String name;
    private String category; // Dynamic category name
    private String level; // A1, A2, B1, B2, C1, C2
    private Long tutorId;
    private String tutorName;
    private Double tutorRating;
    private List<Long> courseIds = new ArrayList<>();
    private Integer coursesCount;
    private BigDecimal price;
    private Integer estimatedDuration;
    private Integer maxStudents;
    private Integer currentEnrolledStudents;
    private Integer availableSlots;
    private Double enrollmentPercentage;
    private LocalDateTime enrollmentStartDate;
    private LocalDateTime enrollmentEndDate;
    private String description;
    private PackStatus status;
    private Long createdBy;
    private Long conversationId; // ID du groupe de discussion
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean isEnrollmentOpen;
}
