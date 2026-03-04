package com.englishflow.courses.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "pack_enrollments", 
    uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "pack_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PackEnrollment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Long studentId;
    
    @Column(nullable = false)
    private String studentName;
    
    @Column(nullable = false)
    private Long packId;
    
    @Column(nullable = false)
    private String packName;
    
    @Column(nullable = false)
    private String packCategory;
    
    @Column(nullable = false)
    private String packLevel;
    
    @Column(nullable = false)
    private Long tutorId;
    
    @Column(nullable = false)
    private String tutorName;
    
    @Column(nullable = false)
    private Integer totalCourses = 0;
    
    @Column(nullable = false)
    private LocalDateTime enrolledAt;
    
    @Column
    private LocalDateTime completedAt;
    
    @Column(nullable = false, length = 20)
    private String status = "ACTIVE"; // ACTIVE, COMPLETED, CANCELLED
    
    @Column(nullable = false)
    private Boolean isActive = true;
    
    @PrePersist
    protected void onCreate() {
        enrolledAt = LocalDateTime.now();
        if (status == null) {
            status = "ACTIVE";
        }
    }
}
