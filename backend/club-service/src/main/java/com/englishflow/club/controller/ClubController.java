package com.englishflow.club.controller;

import com.englishflow.club.dto.ClubDTO;
import com.englishflow.club.dto.ClubWithRoleDTO;
import com.englishflow.club.enums.ClubCategory;
import com.englishflow.club.service.ClubService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/clubs")
@RequiredArgsConstructor
public class ClubController {
    
    private final ClubService clubService;
    
    @GetMapping
    public ResponseEntity<List<ClubDTO>> getAllClubs() {
        return ResponseEntity.ok(clubService.getAllClubs());
    }
    
    @GetMapping("/category/{category}")
    public ResponseEntity<List<ClubDTO>> getClubsByCategory(@PathVariable ClubCategory category) {
        return ResponseEntity.ok(clubService.getClubsByCategory(category));
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<ClubDTO>> searchClubsByName(@RequestParam String name) {
        return ResponseEntity.ok(clubService.searchClubsByName(name));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ClubDTO> getClubById(@PathVariable Integer id) {
        return ResponseEntity.ok(clubService.getClubById(id));
    }
    
    @PostMapping
    public ResponseEntity<ClubDTO> createClub(@Valid @RequestBody ClubDTO clubDTO) {
        ClubDTO createdClub = clubService.createClub(clubDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdClub);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ClubDTO> updateClub(
            @PathVariable Integer id,
            @Valid @RequestBody ClubDTO clubDTO,
            @RequestParam Long requesterId) {
        ClubDTO updatedClub = clubService.updateClub(id, clubDTO, requesterId);
        return ResponseEntity.ok(updatedClub);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteClub(@PathVariable Integer id) {
        clubService.deleteClub(id);
        return ResponseEntity.noContent().build();
    }
    
    // Endpoints pour le workflow d'approbation
    @GetMapping("/pending")
    public ResponseEntity<List<ClubDTO>> getPendingClubs() {
        return ResponseEntity.ok(clubService.getPendingClubs());
    }
    
    @GetMapping("/approved")
    public ResponseEntity<List<ClubDTO>> getApprovedClubs() {
        return ResponseEntity.ok(clubService.getApprovedClubs());
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ClubDTO>> getClubsByUser(@PathVariable Integer userId) {
        return ResponseEntity.ok(clubService.getClubsByUser(userId));
    }
    
    @GetMapping("/user/{userId}/with-role")
    public ResponseEntity<List<ClubWithRoleDTO>> getClubsWithRoleByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(clubService.getClubsWithRoleByUser(userId));
    }
    
    @PostMapping("/{id}/approve")
    public ResponseEntity<ClubDTO> approveClub(
            @PathVariable Integer id,
            @RequestParam Integer reviewerId,
            @RequestParam(required = false) String comment) {
        ClubDTO approvedClub = clubService.approveClub(id, reviewerId, comment);
        return ResponseEntity.ok(approvedClub);
    }
    
    @PostMapping("/{id}/reject")
    public ResponseEntity<ClubDTO> rejectClub(
            @PathVariable Integer id,
            @RequestParam Integer reviewerId,
            @RequestParam(required = false) String comment) {
        ClubDTO rejectedClub = clubService.rejectClub(id, reviewerId, comment);
        return ResponseEntity.ok(rejectedClub);
    }
    
    @PostMapping("/{id}/suspend")
    public ResponseEntity<ClubDTO> suspendClub(
            @PathVariable Integer id,
            @RequestParam Integer managerId,
            @RequestParam(required = true) String reason) {
        try {
            ClubDTO suspendedClub = clubService.suspendClub(id, managerId, reason);
            return ResponseEntity.ok(suspendedClub);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PostMapping("/{id}/activate")
    public ResponseEntity<ClubDTO> activateClub(
            @PathVariable Integer id,
            @RequestParam Integer managerId) {
        try {
            ClubDTO activatedClub = clubService.activateClub(id, managerId);
            return ResponseEntity.ok(activatedClub);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}