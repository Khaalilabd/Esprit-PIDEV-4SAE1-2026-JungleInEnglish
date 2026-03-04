package com.englishflow.club.controller;

import com.englishflow.club.dto.ClubHistoryDTO;
import com.englishflow.club.enums.ClubHistoryType;
import com.englishflow.club.service.ClubHistoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/clubs/history")
@RequiredArgsConstructor
@Slf4j
public class ClubHistoryController {
    
    private final ClubHistoryService historyService;
    
    /**
     * Obtenir l'historique complet d'un club
     * GET /api/clubs/history/club/{clubId}
     */
    @GetMapping("/club/{clubId}")
    public ResponseEntity<List<ClubHistoryDTO>> getClubHistory(@PathVariable Long clubId) {
        log.info("REST request to get history for club: {}", clubId);
        List<ClubHistoryDTO> history = historyService.getClubHistory(clubId);
        return ResponseEntity.ok(history);
    }
    
    /**
     * Obtenir l'historique d'un utilisateur dans un club
     * GET /api/clubs/history/club/{clubId}/user/{userId}
     */
    @GetMapping("/club/{clubId}/user/{userId}")
    public ResponseEntity<List<ClubHistoryDTO>> getUserHistoryInClub(
            @PathVariable Long clubId,
            @PathVariable Long userId) {
        log.info("REST request to get history for user {} in club {}", userId, clubId);
        try {
            List<ClubHistoryDTO> history = historyService.getUserHistoryInClub(clubId, userId);
            log.info("Found {} history entries", history.size());
            
            // Log each entry for debugging
            for (ClubHistoryDTO entry : history) {
                log.info("History entry: id={}, type={}, action={}, createdAt={}", 
                    entry.getId(), entry.getType(), entry.getAction(), entry.getCreatedAt());
            }
            
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            log.error("Error getting user history in club: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Test endpoint - GET /api/clubs/history/test
     */
    @GetMapping("/test")
    public ResponseEntity<String> test() {
        log.info("Test endpoint called");
        return ResponseEntity.ok("ClubHistory API is working!");
    }
    
    /**
     * Obtenir l'historique d'un utilisateur (tous les clubs)
     * GET /api/clubs/history/user/{userId}
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ClubHistoryDTO>> getUserHistory(@PathVariable Long userId) {
        log.info("REST request to get all history for user: {}", userId);
        List<ClubHistoryDTO> history = historyService.getUserHistory(userId);
        return ResponseEntity.ok(history);
    }
    
    /**
     * Obtenir l'historique par type
     * GET /api/clubs/history/club/{clubId}/type/{type}
     */
    @GetMapping("/club/{clubId}/type/{type}")
    public ResponseEntity<List<ClubHistoryDTO>> getHistoryByType(
            @PathVariable Long clubId,
            @PathVariable ClubHistoryType type) {
        log.info("REST request to get history of type {} for club {}", type, clubId);
        List<ClubHistoryDTO> history = historyService.getHistoryByType(clubId, type);
        return ResponseEntity.ok(history);
    }
    
    /**
     * Obtenir l'historique récent (derniers X jours)
     * GET /api/clubs/history/club/{clubId}/recent?days=30
     */
    @GetMapping("/club/{clubId}/recent")
    public ResponseEntity<List<ClubHistoryDTO>> getRecentHistory(
            @PathVariable Long clubId,
            @RequestParam(defaultValue = "30") int days) {
        log.info("REST request to get recent history ({} days) for club {}", days, clubId);
        List<ClubHistoryDTO> history = historyService.getRecentHistory(clubId, days);
        return ResponseEntity.ok(history);
    }
    
    /**
     * Compter les entrées d'historique d'un club
     * GET /api/clubs/history/club/{clubId}/count
     */
    @GetMapping("/club/{clubId}/count")
    public ResponseEntity<Long> countClubHistory(@PathVariable Long clubId) {
        log.info("REST request to count history for club: {}", clubId);
        long count = historyService.countClubHistory(clubId);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Compter les entrées d'historique d'un utilisateur dans un club
     * GET /api/clubs/history/club/{clubId}/user/{userId}/count
     */
    @GetMapping("/club/{clubId}/user/{userId}/count")
    public ResponseEntity<Long> countUserHistoryInClub(
            @PathVariable Long clubId,
            @PathVariable Long userId) {
        log.info("REST request to count history for user {} in club {}", userId, clubId);
        long count = historyService.countUserHistoryInClub(clubId, userId);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Créer une entrée d'historique manuellement (pour tests ou admin)
     * POST /api/clubs/history
     */
    @PostMapping
    public ResponseEntity<ClubHistoryDTO> createHistory(@RequestBody ClubHistoryDTO historyDTO) {
        log.info("REST request to create history entry: {}", historyDTO);
        ClubHistoryDTO created = historyService.createHistory(historyDTO);
        return ResponseEntity.ok(created);
    }
}
