package com.englishflow.exam.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;
import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;

import java.time.LocalDateTime;

@Entity
@Table(name = "student_answers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class StudentAnswer {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    @JsonIgnore
    private StudentExamAttempt attempt;
    
    @Column(name = "question_id", nullable = false)
    private String questionId;
    
    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private JsonNode answerData; // null until student answers
    
    private Boolean isCorrect; // null until graded
    private Double score; // null until graded
    
    @Column(columnDefinition = "TEXT")
    private String manualFeedback; // examiner note for OPEN_WRITING
    
    private LocalDateTime gradedAt;
    private Long gradedBy; // examiner userId, nullable
}
