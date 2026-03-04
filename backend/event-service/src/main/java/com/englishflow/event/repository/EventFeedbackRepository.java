package com.englishflow.event.repository;

import com.englishflow.event.entity.EventFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventFeedbackRepository extends JpaRepository<EventFeedback, Long> {
    
    List<EventFeedback> findByEventId(Integer eventId);
    
    Optional<EventFeedback> findByEventIdAndUserId(Integer eventId, Long userId);
    
    boolean existsByEventIdAndUserId(Integer eventId, Long userId);
    
    @Query("SELECT COUNT(f) FROM EventFeedback f WHERE f.eventId = :eventId")
    Long countByEventId(@Param("eventId") Integer eventId);
    
    @Query("SELECT AVG(f.rating) FROM EventFeedback f WHERE f.eventId = :eventId")
    Double getAverageRatingByEventId(@Param("eventId") Integer eventId);
    
    @Query("SELECT COUNT(f) FROM EventFeedback f WHERE f.eventId = :eventId AND f.rating >= 4")
    Long countSatisfiedByEventId(@Param("eventId") Integer eventId);
    
    @Query("SELECT f.rating, COUNT(f) FROM EventFeedback f WHERE f.eventId = :eventId GROUP BY f.rating")
    List<Object[]> getRatingDistributionByEventId(@Param("eventId") Integer eventId);
}
