package com.englishflow.courses.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "course_enrollments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CourseEnrollment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Long studentId; // Reference to User ID from auth-service
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;
    
    @Column(nullable = false)
    private LocalDateTime enrolledAt;
    
    @Column
    private LocalDateTime completedAt;
    
    @Column(nullable = false)
    private Boolean isActive = true;
    
    @Column
    private Integer totalLessons = 0; // Total published lessons at enrollment time
    
    @Column
    private LocalDateTime lastAccessedAt;
    
    @PrePersist
    protected void onCreate() {
        enrolledAt = LocalDateTime.now();
        lastAccessedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        lastAccessedAt = LocalDateTime.now();
    }
}