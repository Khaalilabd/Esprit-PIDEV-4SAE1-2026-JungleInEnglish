package com.englishflow.community.repository;

import com.englishflow.community.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    Page<Post> findByTopicId(Long topicId, Pageable pageable);
    
    // Sort by weighted score (most helpful/popular)
    @Query("SELECT p FROM Post p WHERE p.topic.id = :topicId ORDER BY p.isAccepted DESC, p.weightedScore DESC, p.createdAt DESC")
    Page<Post> findByTopicIdOrderByWeightedScore(@Param("topicId") Long topicId, Pageable pageable);
    
    // Sort by recent activity
    @Query("SELECT p FROM Post p WHERE p.topic.id = :topicId ORDER BY p.isAccepted DESC, p.updatedAt DESC")
    Page<Post> findByTopicIdOrderByRecent(@Param("topicId") Long topicId, Pageable pageable);
    
    // Sort by trending (high score + recent - created in last 7 days with score >= 5)
    @Query("SELECT p FROM Post p WHERE p.topic.id = :topicId " +
           "AND p.createdAt >= :since AND p.weightedScore >= 5 " +
           "ORDER BY p.isAccepted DESC, p.weightedScore DESC, p.createdAt DESC")
    Page<Post> findByTopicIdOrderByTrending(@Param("topicId") Long topicId, @Param("since") LocalDateTime since, Pageable pageable);
    
    // Find top posts by weighted score in a topic
    @Query("SELECT p FROM Post p WHERE p.topic.id = :topicId ORDER BY p.weightedScore DESC")
    List<Post> findTopPostsByTopic(@Param("topicId") Long topicId, Pageable pageable);
    
    // Find trending posts (created in last 7 days with high score)
    @Query("SELECT p FROM Post p WHERE p.createdAt >= :since ORDER BY p.weightedScore DESC")
    List<Post> findTrendingPosts(@Param("since") LocalDateTime since, Pageable pageable);
    
    // ✅ OPTIMIZED: Bulk update trending flags
    @Modifying
    @Query("UPDATE Post p SET p.isTrending = false WHERE p.isTrending = true")
    int resetAllTrendingFlags();
    
    @Modifying
    @Query("UPDATE Post p SET p.isTrending = true WHERE p.id IN :ids")
    int markAsTrending(@Param("ids") List<Long> ids);
}
