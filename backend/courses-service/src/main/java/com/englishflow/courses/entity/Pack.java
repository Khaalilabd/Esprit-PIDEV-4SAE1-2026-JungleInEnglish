package com.englishflow.courses.entity;

import com.englishflow.courses.enums.PackStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "packs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Pack {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false, length = 100)
    private String category; // Dynamic category name from course_categories table
    
    @Column(nullable = false, length = 10)
    private String level; // A1, A2, B1, B2, C1, C2
    
    @Column(nullable = false)
    private Long tutorId;
    
    @Column(nullable = false)
    private String tutorName;
    
    @Column
    private Double tutorRating = 0.0;
    
    @ElementCollection
    @CollectionTable(name = "pack_courses", joinColumns = @JoinColumn(name = "pack_id"))
    @Column(name = "course_id")
    private List<Long> courseIds = new ArrayList<>();
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;
    
    @Column(nullable = false)
    private Integer estimatedDuration; // en heures
    
    @Column(nullable = false)
    private Integer maxStudents;
    
    @Column(nullable = false)
    private Integer currentEnrolledStudents = 0;
    
    @Column
    private LocalDateTime enrollmentStartDate;
    
    @Column
    private LocalDateTime enrollmentEndDate;
    
    @Column(length = 2000)
    private String description;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PackStatus status = PackStatus.DRAFT;
    
    @Column(nullable = false)
    private Long createdBy; // academicId
    
    @Column
    private Long conversationId; // ID du groupe de discussion dans messaging-service
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @Column
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public Integer getAvailableSlots() {
        return maxStudents - currentEnrolledStudents;
    }
    
    public Double getEnrollmentPercentage() {
        if (maxStudents == 0) return 0.0;
        return (currentEnrolledStudents.doubleValue() / maxStudents.doubleValue()) * 100;
    }
    
    public boolean isFull() {
        return currentEnrolledStudents >= maxStudents;
    }
    
    public boolean isEnrollmentOpen() {
        LocalDateTime now = LocalDateTime.now();
        return status == PackStatus.ACTIVE 
            && !isFull()
            && (enrollmentStartDate == null || now.isAfter(enrollmentStartDate))
            && (enrollmentEndDate == null || now.isBefore(enrollmentEndDate));
    }
}
