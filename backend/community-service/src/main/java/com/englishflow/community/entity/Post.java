package com.englishflow.community.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "posts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Post {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "user_name")
    private String userName;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id", nullable = false)
    private Topic topic;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Reaction> reactions = new ArrayList<>();
    
    @Column(name = "reactions_count")
    private Integer reactionsCount = 0;
    
    // Stack Overflow-like features
    @Column(name = "upvotes")
    private Integer upvotes = 0;
    
    @Column(name = "downvotes")
    private Integer downvotes = 0;
    
    @Column(name = "score")
    private Integer score = 0; // upvotes - downvotes
    
    @Column(name = "is_accepted")
    private Boolean isAccepted = false; // Marked as solution/accepted answer
    
    // Weighted score based on reaction types
    @Column(name = "like_count")
    private Integer likeCount = 0;
    
    @Column(name = "insightful_count")
    private Integer insightfulCount = 0;
    
    @Column(name = "helpful_count")
    private Integer helpfulCount = 0;
    
    @Column(name = "weighted_score")
    private Integer weightedScore = 0; // likes*1 + insightful*2 + helpful*3
    
    @Column(name = "is_trending")
    private Boolean isTrending = false; // Top post this week
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public void updateScore() {
        this.score = this.upvotes - this.downvotes;
    }
    
    /**
     * Calculate weighted score based on reaction types
     * Formula: likes*1 + insightful*2 + helpful*3
     */
    public void calculateWeightedScore() {
        this.weightedScore = (this.likeCount * 1) + (this.insightfulCount * 2) + (this.helpfulCount * 3);
    }
    
    /**
     * Update reaction counts from reactions list
     */
    public void updateReactionCounts() {
        this.likeCount = (int) reactions.stream()
            .filter(r -> Reaction.ReactionType.LIKE.equals(r.getType()))
            .count();
        
        this.insightfulCount = (int) reactions.stream()
            .filter(r -> Reaction.ReactionType.INSIGHTFUL.equals(r.getType()))
            .count();
        
        this.helpfulCount = (int) reactions.stream()
            .filter(r -> Reaction.ReactionType.HELPFUL.equals(r.getType()))
            .count();
        
        this.reactionsCount = this.likeCount + this.insightfulCount + this.helpfulCount;
        
        calculateWeightedScore();
    }
}
