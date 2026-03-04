package com.englishflow.event.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "event_feedbacks", indexes = {
    @Index(name = "idx_feedback_event", columnList = "eventId"),
    @Index(name = "idx_feedback_user", columnList = "userId"),
    @Index(name = "idx_feedback_event_user", columnList = "eventId,userId", unique = true)
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EventFeedback {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Integer eventId;
    
    @Column(nullable = false)
    private Long userId;
    
    @Column(nullable = false)
    private Double rating; // 0.5-5.0 stars (allows half stars)
    
    @Column(length = 500)
    private String comment;
    
    @Column(nullable = false)
    private Boolean anonymous = false;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
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
}
