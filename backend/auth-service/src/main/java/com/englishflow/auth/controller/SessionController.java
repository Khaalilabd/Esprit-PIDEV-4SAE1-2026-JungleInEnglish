package com.englishflow.auth.controller;

import com.englishflow.auth.dto.SessionSearchRequest;
import com.englishflow.auth.dto.UserSessionResponse;
import com.englishflow.auth.entity.UserSession;
import com.englishflow.auth.service.UserSessionService;
import com.englishflow.auth.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/sessions")
@RequiredArgsConstructor
@Slf4j
public class SessionController {

    private final UserSessionService userSessionService;
    private final JwtUtil jwtUtil;
    private final com.englishflow.auth.repository.UserRepository userRepository;

    /**
     * Get current user's active sessions
     */
    @GetMapping("/my-sessions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<UserSessionResponse>> getMyActiveSessions(
            HttpServletRequest request,
            @RequestParam(required = false) String currentSessionToken) {
        
        Long userId = extractUserIdFromRequest(request);
        
        List<UserSession> sessions = userSessionService.getActiveUserSessions(userId);
        List<UserSessionResponse> response = sessions.stream()
                .map(session -> enrichSessionWithUserInfo(
                    UserSessionResponse.fromEntityWithCurrentFlag(session, currentSessionToken)))
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get all sessions for current user with pagination
     */
    @GetMapping("/my-sessions/all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<UserSessionResponse>> getMyAllSessions(
            HttpServletRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String currentSessionToken) {
        
        Long userId = extractUserIdFromRequest(request);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<UserSession> sessions = userSessionService.getUserSessions(userId, pageable);
        Page<UserSessionResponse> response = sessions.map(session -> 
            enrichSessionWithUserInfo(
                UserSessionResponse.fromEntityWithCurrentFlag(session, currentSessionToken)));
        
        return ResponseEntity.ok(response);
    }

    /**
     * Terminate a specific session (user can terminate their own sessions)
     */
    @DeleteMapping("/my-sessions/{sessionId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> terminateMySession(
            @PathVariable Long sessionId,
            HttpServletRequest request) {
        
        Long userId = extractUserIdFromRequest(request);
        
        // Verify the session belongs to the current user
        userSessionService.getSessionByToken("dummy").ifPresent(session -> {
            if (!session.getUserId().equals(userId)) {
                throw new com.englishflow.auth.exception.UnauthorizedSessionAccessException(
                    "Unauthorized to terminate session " + sessionId + " for user " + userId
                );
            }
        });
        
        boolean terminated = userSessionService.terminateSession(sessionId, 
            UserSession.TerminationReason.USER_LOGOUT);
        
        if (terminated) {
            return ResponseEntity.ok(Map.of("message", "Session terminated successfully"));
        } else {
            throw new com.englishflow.auth.exception.SessionNotFoundException(sessionId);
        }
    }

    /**
     * Terminate all other sessions (keep current session active)
     */
    @DeleteMapping("/my-sessions/others")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> terminateOtherSessions(
            HttpServletRequest request,
            @RequestParam(required = false) String currentSessionToken) {
        
        Long userId = extractUserIdFromRequest(request);
        
        // Get all active sessions
        List<UserSession> activeSessions = userSessionService.getActiveUserSessions(userId);
        
        // Terminate all except current session
        int terminatedCount = 0;
        for (UserSession session : activeSessions) {
            if (!session.getSessionToken().equals(currentSessionToken)) {
                userSessionService.terminateSession(session.getId(), 
                    UserSession.TerminationReason.USER_LOGOUT);
                terminatedCount++;
            }
        }
        
        return ResponseEntity.ok(Map.of(
            "message", "Other sessions terminated successfully",
            "terminatedCount", terminatedCount
        ));
    }

    // Admin endpoints
    
    /**
     * Search all sessions (admin only)
     */
    @PostMapping("/admin/search")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<UserSessionResponse>> searchSessions(@RequestBody SessionSearchRequest request) {
        // Apply quick filter if specified
        request.applyQuickFilter();
        
        // Create pageable with sorting
        Sort sort = Sort.by(
            request.getSortDirection().equalsIgnoreCase("ASC") ? 
            Sort.Direction.ASC : Sort.Direction.DESC,
            request.getSortBy()
        );
        Pageable pageable = PageRequest.of(request.getPage(), request.getSize(), sort);
        
        // Search sessions
        Page<UserSession> sessions = userSessionService.searchSessions(
            request.getUserId(),
            request.getStatus(),
            request.getDeviceType(),
            request.getIpAddress(),
            request.getCountry(),
            request.getSuspicious(),
            request.getStartDate(),
            request.getEndDate(),
            pageable
        );
        
        // Convert to response DTOs and enrich with user information
        Page<UserSessionResponse> response = sessions.map(session -> enrichSessionWithUserInfo(session));
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Enrich session with user information
     */
    private UserSessionResponse enrichSessionWithUserInfo(UserSessionResponse response) {
        // Get user information
        userRepository.findById(response.getUserId()).ifPresent(user -> {
            response.setUserName(user.getFirstName() + " " + user.getLastName());
            response.setUserEmail(user.getEmail());
        });
        
        return response;
    }

    /**
     * Get sessions for a specific user (admin only)
     */
    @GetMapping("/admin/user/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<UserSessionResponse>> getUserSessions(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "lastActivity"));
        Page<UserSession> sessions = userSessionService.getUserSessions(userId, pageable);
        Page<UserSessionResponse> response = sessions.map(UserSessionResponse::fromEntity);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get suspicious sessions (admin only)
     */
    @GetMapping("/admin/suspicious")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserSessionResponse>> getSuspiciousSessions() {
        List<UserSession> suspiciousSessions = userSessionService.getSuspiciousSessions();
        List<UserSessionResponse> response = suspiciousSessions.stream()
                .map(UserSessionResponse::fromEntity)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Terminate any session (admin only)
     */
    @DeleteMapping("/admin/{sessionId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> terminateSession(
            @PathVariable Long sessionId,
            @RequestParam(defaultValue = "ADMIN_TERMINATED") String reason) {
        
        UserSession.TerminationReason terminationReason;
        try {
            terminationReason = UserSession.TerminationReason.valueOf(reason.toUpperCase());
        } catch (IllegalArgumentException e) {
            terminationReason = UserSession.TerminationReason.ADMIN_TERMINATED;
        }
        
        boolean terminated = userSessionService.terminateSession(sessionId, terminationReason);
        
        if (terminated) {
            return ResponseEntity.ok(Map.of("message", "Session terminated successfully"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to terminate session"));
        }
    }

    /**
     * Terminate all sessions for a user (admin only)
     */
    @DeleteMapping("/admin/user/{userId}/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> terminateAllUserSessions(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "ADMIN_TERMINATED") String reason) {
        
        UserSession.TerminationReason terminationReason;
        try {
            terminationReason = UserSession.TerminationReason.valueOf(reason.toUpperCase());
        } catch (IllegalArgumentException e) {
            terminationReason = UserSession.TerminationReason.ADMIN_TERMINATED;
        }
        
        int terminatedCount = userSessionService.terminateAllUserSessions(userId, terminationReason);
        
        return ResponseEntity.ok(Map.of(
            "message", "All user sessions terminated successfully",
            "terminatedCount", terminatedCount
        ));
    }

    /**
     * Get session statistics for dashboard (admin only)
     */
    @GetMapping("/admin/statistics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getSessionStatistics(
            @RequestParam(defaultValue = "30") int days) {
        
        Map<String, Object> statistics = userSessionService.getSessionStatistics(days);
        return ResponseEntity.ok(statistics);
    }

    /**
     * Get available filter options (admin only)
     */
    @GetMapping("/admin/filters")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getFilterOptions() {
        Map<String, Object> filters = Map.of(
            "statuses", UserSession.SessionStatus.values(),
            "deviceTypes", List.of("DESKTOP", "MOBILE", "TABLET", "UNKNOWN"),
            "terminationReasons", UserSession.TerminationReason.values(),
            "quickFilters", List.of("TODAY", "YESTERDAY", "LAST_WEEK", "LAST_MONTH", "ACTIVE_ONLY", "SUSPICIOUS_ONLY"),
            "riskLevels", List.of("HIGH", "MEDIUM", "LOW")
        );
        
        return ResponseEntity.ok(filters);
    }

    /**
     * Force cleanup of inactive/expired sessions (admin only)
     */
    @PostMapping("/admin/cleanup")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> forceCleanup() {
        userSessionService.cleanupSessions();
        return ResponseEntity.ok(Map.of("message", "Session cleanup completed"));
    }

    // Helper method to extract user ID from JWT token
    private Long extractUserIdFromRequest(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                // Extract user ID from JWT token using JwtUtil
                return jwtUtil.extractUserId(token);
            } catch (Exception e) {
                throw new com.englishflow.auth.exception.InvalidTokenException("Invalid JWT token");
            }
        }
        
        throw new com.englishflow.auth.exception.InvalidTokenException("No valid authentication token found");
    }
}