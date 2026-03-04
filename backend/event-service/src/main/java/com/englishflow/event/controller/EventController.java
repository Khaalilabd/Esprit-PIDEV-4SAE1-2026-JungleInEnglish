package com.englishflow.event.controller;

import com.englishflow.event.dto.EventDTO;
import com.englishflow.event.enums.EventType;
import com.englishflow.event.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/events")
@RequiredArgsConstructor
public class EventController {
    
    private final EventService eventService;
    
    @GetMapping
    public ResponseEntity<List<EventDTO>> getAllEvents() {
        return ResponseEntity.ok(eventService.getAllEvents());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<EventDTO> getEventById(@PathVariable Integer id) {
        return ResponseEntity.ok(eventService.getEventById(id));
    }
    
    @GetMapping("/type/{type}")
    public ResponseEntity<List<EventDTO>> getEventsByType(@PathVariable EventType type) {
        return ResponseEntity.ok(eventService.getEventsByType(type));
    }
    
    @GetMapping("/upcoming")
    public ResponseEntity<List<EventDTO>> getUpcomingEvents() {
        return ResponseEntity.ok(eventService.getUpcomingEvents());
    }
    
    @GetMapping("/creator/{creatorId}")
    public ResponseEntity<List<EventDTO>> getEventsByCreator(@PathVariable Long creatorId) {
        return ResponseEntity.ok(eventService.getEventsByCreator(creatorId));
    }
    
    @PostMapping
    public ResponseEntity<EventDTO> createEvent(@Valid @RequestBody EventDTO eventDTO) {
        EventDTO createdEvent = eventService.createEvent(eventDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdEvent);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<EventDTO> updateEvent(
            @PathVariable Integer id,
            @Valid @RequestBody EventDTO eventDTO) {
        return ResponseEntity.ok(eventService.updateEvent(id, eventDTO));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable Integer id) {
        eventService.deleteEvent(id);
        return ResponseEntity.noContent().build();
    }
    
    @PutMapping("/{id}/approve")
    public ResponseEntity<EventDTO> approveEvent(@PathVariable Integer id) {
        return ResponseEntity.ok(eventService.approveEvent(id));
    }
    
    @PutMapping("/{id}/reject")
    public ResponseEntity<EventDTO> rejectEvent(@PathVariable Integer id) {
        return ResponseEntity.ok(eventService.rejectEvent(id));
    }
    
    @PostMapping("/sync-club-names")
    public ResponseEntity<String> syncClubNames() {
        int updated = eventService.syncClubNamesForAllEvents();
        return ResponseEntity.ok("Updated " + updated + " events with club names");
    }
}
