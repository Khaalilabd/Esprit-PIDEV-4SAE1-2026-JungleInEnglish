package com.englishflow.auth.controller;

import com.englishflow.auth.dto.AcceptInvitationRequest;
import com.englishflow.auth.dto.AuthResponse;
import com.englishflow.auth.dto.InvitationRequest;
import com.englishflow.auth.dto.InvitationResponse;
import com.englishflow.auth.entity.User;
import com.englishflow.auth.security.JwtUtil;
import com.englishflow.auth.service.InvitationService;
import com.englishflow.auth.util.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/auth/invitations")
@RequiredArgsConstructor
public class InvitationController {

    private final InvitationService invitationService;
    private final JwtUtil jwtUtil;
    private final SecurityUtil securityUtil;

    @PostMapping("/send")
    public ResponseEntity<InvitationResponse> sendInvitation(@Valid @RequestBody InvitationRequest request) {
        // Extract current user ID from JWT token
        Long invitedBy = securityUtil.getCurrentUserId();
        
        InvitationResponse response = invitationService.sendInvitation(request, invitedBy);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/token/{token}")
    public ResponseEntity<InvitationResponse> getInvitationByToken(@PathVariable String token) {
        InvitationResponse response = invitationService.getInvitationByToken(token);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/accept")
    public ResponseEntity<AuthResponse> acceptInvitation(@Valid @RequestBody AcceptInvitationRequest request) {
        User user = invitationService.acceptInvitation(request);
        
        // Generate JWT token for the new user
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId());
        
        AuthResponse response = AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole().name())
                .build();
        
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<InvitationResponse>> getAllInvitations() {
        List<InvitationResponse> invitations = invitationService.getAllInvitations();
        return ResponseEntity.ok(invitations);
    }

    @GetMapping("/pending")
    public ResponseEntity<List<InvitationResponse>> getPendingInvitations() {
        List<InvitationResponse> invitations = invitationService.getPendingInvitations();
        return ResponseEntity.ok(invitations);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> cancelInvitation(@PathVariable Long id) {
        invitationService.cancelInvitation(id);
        return ResponseEntity.ok(Map.of("message", "Invitation cancelled successfully"));
    }

    @PostMapping("/{id}/resend")
    public ResponseEntity<InvitationResponse> resendInvitation(@PathVariable Long id) {
        InvitationResponse response = invitationService.resendInvitation(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/cleanup")
    public ResponseEntity<Map<String, String>> cleanupExpiredInvitations() {
        invitationService.cleanupExpiredInvitations();
        return ResponseEntity.ok(Map.of("message", "Expired invitations cleaned up successfully"));
    }
}
