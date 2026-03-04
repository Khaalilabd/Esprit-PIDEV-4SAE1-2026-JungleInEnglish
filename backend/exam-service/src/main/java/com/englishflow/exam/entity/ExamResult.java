package com.englishflow.exam.entity;

import com.englishflow.exam.enums.ExamLevel;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;
import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;

import java.time.LocalDateTime;

@Entity
@Table(name = "exam_results")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ExamResult {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false)
    private Long userId;
    
    @Column(name = "attempt_id", nullable = false, unique = true)
    private String attemptId;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExamLevel level;
    
    @Column(nullable = false)
    private Double totalScore;
    
    @Column(nullable = false)
    private Double percentageScore;
    
    @Column(nullable = false)
    private Boolean passed;
    
    // [{ "partId": "...", "partType": "GRAMMAR", "score": 8.0, "maxScore": 10.0 }]
    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb", nullable = false)
    private JsonNode partBreakdown;
    
    @Enumerated(EnumType.STRING)
    private ExamLevel cefrBand; // recommended level based on score
    
    private String certificate; // URL, nullable — generated if passed
    
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
