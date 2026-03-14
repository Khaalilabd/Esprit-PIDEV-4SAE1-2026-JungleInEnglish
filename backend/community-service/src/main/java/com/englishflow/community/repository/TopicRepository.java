package com.englishflow.community.repository;

import com.englishflow.community.entity.Topic;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TopicRepository extends JpaRepository<Topic, Long>, JpaSpecificationExecutor<Topic> {
    @Query("SELECT t FROM Topic t WHERE t.subCategory.id = :subCategoryId ORDER BY t.isPinned DESC, t.createdAt DESC")
    Page<Topic> findBySubCategoryId(Long subCategoryId, Pageable pageable);
    
    // Sort by weighted score (most helpful/popular) - only topics with reactions
    @Query("SELECT t FROM Topic t WHERE t.subCategory.id = :subCategoryId AND t.reactionsCount > 0 ORDER BY t.isPinned DESC, t.weightedScore DESC, t.createdAt DESC")
    Page<Topic> findBySubCategoryIdOrderByWeightedScore(@Param("subCategoryId") Long subCategoryId, Pageable pageable);
    
    // Sort by recent activity
    @Query("SELECT t FROM Topic t WHERE t.subCategory.id = :subCategoryId ORDER BY t.isPinned DESC, t.lastActivityAt DESC")
    Page<Topic> findBySubCategoryIdOrderByRecent(@Param("subCategoryId") Long subCategoryId, Pageable pageable);
    
    // Sort by trending (high score + recent - created in last 7 days with score >= 5)
    @Query("SELECT t FROM Topic t WHERE t.subCategory.id = :subCategoryId " +
           "AND t.createdAt >= :since AND t.weightedScore >= 5 " +
           "ORDER BY t.isPinned DESC, t.weightedScore DESC, t.createdAt DESC")
    Page<Topic> findBySubCategoryIdOrderByTrending(@Param("subCategoryId") Long subCategoryId, @Param("since") LocalDateTime since, Pageable pageable);
    
    // Sort by views
    @Query("SELECT t FROM Topic t WHERE t.subCategory.id = :subCategoryId ORDER BY t.isPinned DESC, t.viewsCount DESC, t.createdAt DESC")
    Page<Topic> findBySubCategoryIdOrderByViews(@Param("subCategoryId") Long subCategoryId, Pageable pageable);
    
    Page<Topic> findByUserId(Long userId, Pageable pageable);
    
    @Query("SELECT t FROM Topic t WHERE LOWER(t.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(t.content) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Topic> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);
    
    long countByIsPinned(Boolean isPinned);
    
    long countByIsLocked(Boolean isLocked);
    
    @Query("SELECT t FROM Topic t ORDER BY t.viewsCount DESC")
    Page<Topic> findMostViewed(Pageable pageable);
    
    @Query("SELECT t FROM Topic t ORDER BY t.reactionsCount DESC")
    Page<Topic> findMostPopular(Pageable pageable);
    
    // Find trending topics (created in last 7 days with high score)
    @Query("SELECT t FROM Topic t WHERE t.createdAt >= :since ORDER BY t.weightedScore DESC")
    List<Topic> findTrendingTopics(@Param("since") LocalDateTime since, Pageable pageable);
    
    // ✅ OPTIMIZED: Bulk update trending flags
    @Modifying
    @Query("UPDATE Topic t SET t.isTrending = false WHERE t.isTrending = true")
    int resetAllTrendingFlags();
    
    @Modifying
    @Query("UPDATE Topic t SET t.isTrending = true WHERE t.id IN :ids")
    int markAsTrending(@Param("ids") List<Long> ids);
}
