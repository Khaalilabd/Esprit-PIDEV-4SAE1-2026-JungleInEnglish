package com.englishflow.messaging.controller;

import com.englishflow.messaging.service.UserPresenceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/messaging/presence")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "User Presence", description = "User online/offline status management")
public class PresenceController {
    
    private final UserPresenceService userPresenceService;
    
    @GetMapping("/online/{userId}")
    @Operation(summary = "Check if user is online")
    public ResponseEntity<Map<String, Object>> isUserOnline(@PathVariable Long userId) {
        boolean isOnline = userPresenceService.isUserOnline(userId);
        LocalDateTime lastSeen = userPresenceService.getLastSeen(userId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("userId", userId);
        response.put("isOnline", isOnline);
        response.put("lastSeen", lastSeen);
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/online")
    @Operation(summary = "Get all online users")
    public ResponseEntity<Map<String, Object>> getOnlineUsers() {
        Set<Long> onlineUsers = userPresenceService.getOnlineUsers();
        
        Map<String, Object> response = new HashMap<>();
        response.put("onlineUsers", onlineUsers);
        response.put("count", onlineUsers.size());
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/heartbeat")
    @Operation(summary = "Send heartbeat to maintain online status")
    public ResponseEntity<Map<String, String>> heartbeat(@RequestHeader("X-User-Id") Long userId) {
        userPresenceService.refreshUserPresence(userId);
        
        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Heartbeat received");
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/online")
    @Operation(summary = "Mark user as online")
    public ResponseEntity<Map<String, String>> markOnline(@RequestHeader("X-User-Id") Long userId) {
        userPresenceService.markUserOnline(userId);
        
        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "User marked as online");
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/offline")
    @Operation(summary = "Mark user as offline")
    public ResponseEntity<Map<String, String>> markOffline(@RequestHeader("X-User-Id") Long userId) {
        userPresenceService.markUserOffline(userId);
        
        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "User marked as offline");
        
        return ResponseEntity.ok(response);
    }
}
