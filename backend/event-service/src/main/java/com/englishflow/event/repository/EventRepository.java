package com.englishflow.event.repository;

import com.englishflow.event.entity.Event;
import com.englishflow.event.enums.EventType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Integer> {
    
    List<Event> findByType(EventType type);
    
    List<Event> findByStartDateAfter(LocalDateTime date);
    
    List<Event> findByStartDateBetween(LocalDateTime start, LocalDateTime end);
    
    List<Event> findByEndDateBefore(LocalDateTime date);
    
    List<Event> findByLocationContainingIgnoreCase(String location);
    
    List<Event> findByCreatorId(Long creatorId);
}
