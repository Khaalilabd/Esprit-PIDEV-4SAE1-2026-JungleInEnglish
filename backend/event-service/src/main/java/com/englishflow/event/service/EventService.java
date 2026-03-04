package com.englishflow.event.service;

import com.englishflow.event.dto.EventDTO;
import com.englishflow.event.entity.Event;
import com.englishflow.event.enums.EventType;
import com.englishflow.event.exception.ResourceNotFoundException;
import com.englishflow.event.mapper.EventMapper;
import com.englishflow.event.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventService {
    
    private final EventRepository eventRepository;
    private final PermissionService permissionService;
    private final EventMapper eventMapper;
    private final com.englishflow.event.client.ClubServiceClient clubServiceClient;
    
    @Cacheable(value = "events", key = "'all'")
    @Transactional(readOnly = true)
    public List<EventDTO> getAllEvents() {
        log.info("Fetching all events from database");
        try {
            List<Event> events = eventRepository.findAll();
            log.info("Found {} events", events.size());
            return events.stream()
                    .map(event -> enrichEventWithClubName(eventMapper.toDTO(event)))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching all events", e);
            throw e;
        }
    }
    
    @Cacheable(value = "eventById", key = "#id")
    @Transactional(readOnly = true)
    public EventDTO getEventById(Integer id) {
        log.debug("Fetching event by id: {}", id);
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));
        return enrichEventWithClubName(eventMapper.toDTO(event));
    }
    
    @Cacheable(value = "eventsByType", key = "#type")
    @Transactional(readOnly = true)
    public List<EventDTO> getEventsByType(EventType type) {
        log.debug("Fetching events by type: {}", type);
        return eventRepository.findByType(type).stream()
                .map(event -> enrichEventWithClubName(eventMapper.toDTO(event)))
                .collect(Collectors.toList());
    }
    
    @Cacheable(value = "upcomingEvents")
    @Transactional(readOnly = true)
    public List<EventDTO> getUpcomingEvents() {
        log.info("Fetching upcoming events");
        try {
            LocalDateTime now = LocalDateTime.now();
            log.debug("Current time: {}", now);
            List<Event> events = eventRepository.findByStartDateAfter(now);
            log.info("Found {} upcoming events", events.size());
            return events.stream()
                    .map(event -> enrichEventWithClubName(eventMapper.toDTO(event)))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching upcoming events", e);
            throw e;
        }
    }
    
    @Transactional(readOnly = true)
    public List<EventDTO> getEventsByCreator(Long creatorId) {
        log.info("Fetching events created by user: {}", creatorId);
        return eventRepository.findByCreatorId(creatorId).stream()
                .map(event -> enrichEventWithClubName(eventMapper.toDTO(event)))
                .collect(Collectors.toList());
    }
    
    /**
     * Enriches an EventDTO with club name if clubId is present but clubName is missing
     */
    private EventDTO enrichEventWithClubName(EventDTO eventDTO) {
        if (eventDTO.getClubId() != null && (eventDTO.getClubName() == null || eventDTO.getClubName().isEmpty())) {
            try {
                var club = clubServiceClient.getClubById(eventDTO.getClubId());
                eventDTO.setClubName(club.getName());
                log.debug("Enriched event {} with club name: {}", eventDTO.getId(), club.getName());
            } catch (Exception e) {
                log.warn("Could not fetch club name for event {} with clubId {}", eventDTO.getId(), eventDTO.getClubId(), e);
                eventDTO.setClubName("Unknown Club");
            }
        }
        return eventDTO;
    }
    
    @Caching(evict = {
        @CacheEvict(value = "events", key = "'all'"),
        @CacheEvict(value = "eventsByType", allEntries = true),
        @CacheEvict(value = "upcomingEvents", allEntries = true)
    })
    @Transactional
    public EventDTO createEvent(EventDTO eventDTO) {
        log.info("Creating new event: {}", eventDTO.getTitle());
        permissionService.checkEventCreationPermission(eventDTO.getCreatorId());
        
        // Récupérer le club de l'utilisateur
        try {
            var memberships = clubServiceClient.getMembersByUserId(eventDTO.getCreatorId());
            if (!memberships.isEmpty()) {
                // Prendre le premier club où l'utilisateur a un rôle autorisé
                var membership = memberships.stream()
                    .filter(m -> m.getRank() != null && 
                        (m.getRank().name().equals("PRESIDENT") || 
                         m.getRank().name().equals("VICE_PRESIDENT") || 
                         m.getRank().name().equals("EVENT_MANAGER")))
                    .findFirst();
                
                if (membership.isPresent()) {
                    Integer clubId = membership.get().getClubId();
                    eventDTO.setClubId(clubId);
                    
                    // Récupérer le nom du club
                    try {
                        var club = clubServiceClient.getClubById(clubId);
                        eventDTO.setClubName(club.getName());
                        log.info("Event will be created for club: {} (ID: {})", club.getName(), clubId);
                    } catch (Exception e) {
                        log.warn("Could not fetch club name for clubId: {}", clubId, e);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Could not fetch club information for user: {}", eventDTO.getCreatorId(), e);
        }
        
        Event event = eventMapper.toEntity(eventDTO);
        event.setCurrentParticipants(0);
        Event savedEvent = eventRepository.save(event);
        log.info("Event created successfully by user: {}", eventDTO.getCreatorId());
        return enrichEventWithClubName(eventMapper.toDTO(savedEvent));
    }
    
    @Caching(evict = {
        @CacheEvict(value = "events", key = "'all'"),
        @CacheEvict(value = "eventById", key = "#id"),
        @CacheEvict(value = "eventsByType", allEntries = true),
        @CacheEvict(value = "upcomingEvents", allEntries = true)
    })
    @Transactional
    public EventDTO updateEvent(Integer id, EventDTO eventDTO) {
        log.info("Updating event id: {}", id);
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));
        
        eventMapper.updateEntityFromDTO(eventDTO, event);
        Event updatedEvent = eventRepository.save(event);
        log.info("Event updated successfully: {}", id);
        return enrichEventWithClubName(eventMapper.toDTO(updatedEvent));
    }
    
    @Caching(evict = {
        @CacheEvict(value = "events", key = "'all'"),
        @CacheEvict(value = "eventById", key = "#id"),
        @CacheEvict(value = "eventsByType", allEntries = true),
        @CacheEvict(value = "upcomingEvents", allEntries = true)
    })
    @Transactional
    public void deleteEvent(Integer id) {
        log.info("Deleting event id: {}", id);
        if (!eventRepository.existsById(id)) {
            throw new ResourceNotFoundException("Event not found with id: " + id);
        }
        eventRepository.deleteById(id);
        log.info("Event deleted successfully: {}", id);
    }
    
    @CacheEvict(value = {"eventById", "events"}, allEntries = true)
    @Transactional
    public EventDTO approveEvent(Integer id) {
        log.info("Approving event id: {}", id);
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));
        
        event.setStatus(com.englishflow.event.enums.EventStatus.APPROVED);
        Event updatedEvent = eventRepository.save(event);
        log.info("Event {} approved successfully", id);
        return enrichEventWithClubName(eventMapper.toDTO(updatedEvent));
    }
    
    @CacheEvict(value = {"eventById", "events"}, allEntries = true)
    @Transactional
    public EventDTO rejectEvent(Integer id) {
        log.info("Rejecting event id: {}", id);
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));
        
        event.setStatus(com.englishflow.event.enums.EventStatus.REJECTED);
        Event updatedEvent = eventRepository.save(event);
        log.info("Event {} rejected successfully", id);
        return enrichEventWithClubName(eventMapper.toDTO(updatedEvent));
    }
    
    @CacheEvict(value = {"events", "eventById", "eventsByType", "upcomingEvents"}, allEntries = true)
    @Transactional
    public int syncClubNamesForAllEvents() {
        log.info("Syncing club names for all events");
        List<Event> events = eventRepository.findAll();
        int updated = 0;
        
        for (Event event : events) {
            if (event.getCreatorId() != null) {
                try {
                    var memberships = clubServiceClient.getMembersByUserId(event.getCreatorId());
                    if (!memberships.isEmpty()) {
                        var membership = memberships.stream()
                            .filter(m -> m.getRank() != null && 
                                (m.getRank().name().equals("PRESIDENT") || 
                                 m.getRank().name().equals("VICE_PRESIDENT") || 
                                 m.getRank().name().equals("EVENT_MANAGER")))
                            .findFirst();
                        
                        if (membership.isPresent()) {
                            Integer clubId = membership.get().getClubId();
                            try {
                                var club = clubServiceClient.getClubById(clubId);
                                event.setClubId(clubId);
                                event.setClubName(club.getName());
                                eventRepository.save(event);
                                updated++;
                                log.info("Updated event {} with club: {} (ID: {})", event.getId(), club.getName(), clubId);
                            } catch (Exception e) {
                                log.warn("Could not fetch club for event {}", event.getId(), e);
                            }
                        }
                    }
                } catch (Exception e) {
                    log.warn("Could not sync club for event {}", event.getId(), e);
                }
            }
        }
        
        log.info("Synced {} events with club names", updated);
        return updated;
    }
}