package com.englishflow.exam.entity;

import com.englishflow.exam.enums.AttemptStatus;
import com.englishflow.exam.enums.GradingMode;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "student_exam_attempts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class StudentExamAttempt {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false)
    private Long userId; // from JWT — NO FK to User table
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    @JsonIgnore
    private Exam exam;
    
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime startedAt;
    
    private LocalDateTime submittedAt;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AttemptStatus status = AttemptStatus.STARTED;
    
    private Double totalScore;
    private Double percentageScore;
    private Boolean passed;
    private Integer timeSpent; // seconds
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GradingMode gradingMode = GradingMode.HYBRID;
    
    @OneToMany(mappedBy = "attempt", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<StudentAnswer> answers = new ArrayList<>();
}
