package com.englishflow.courses.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "lesson_progress",
    uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "lesson_id"}),
    indexes = {
        @Index(name = "idx_student_id", columnList = "student_id"),
        @Index(name = "idx_course_id", columnList = "course_id"),
        @Index(name = "idx_student_course", columnList = "student_id, course_id")
    })
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LessonProgress {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Long studentId;
    
    @Column(nullable = false)
    private Long lessonId;
    
    @Column(nullable = false)
    private Long courseId;
    
    @Column(nullable = false)
    private Boolean isCompleted = false;
    
    private LocalDateTime completedAt;
    
    private Integer timeSpent;
    
    private LocalDateTime lastAccessedAt;
    
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    @PrePersist
    public void prePersist() {
        if (lastAccessedAt == null) {
            lastAccessedAt = LocalDateTime.now();
        }
    }
    
    @PreUpdate
    public void preUpdate() {
        lastAccessedAt = LocalDateTime.now();
        if (isCompleted && completedAt == null) {
            completedAt = LocalDateTime.now();
        }
    }
}
