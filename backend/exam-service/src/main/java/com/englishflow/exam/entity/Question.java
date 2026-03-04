package com.englishflow.exam.entity;

import com.englishflow.exam.enums.QuestionType;
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

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Question {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuestionType questionType;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String prompt;
    
    private String mediaUrl; // image or audio clip, nullable
    
    @Column(nullable = false)
    @Builder.Default
    private Integer orderIndex = 0;
    
    @Column(nullable = false)
    @Builder.Default
    private Double points = 1.0;
    
    @Column(columnDefinition = "TEXT")
    private String explanation; // shown after submit, nullable
    
    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private JsonNode metadata;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "part_id", nullable = false)
    @JsonIgnore
    private ExamPart part;
    
    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("orderIndex ASC")
    @Builder.Default
    private List<QuestionOption> options = new ArrayList<>();
}
