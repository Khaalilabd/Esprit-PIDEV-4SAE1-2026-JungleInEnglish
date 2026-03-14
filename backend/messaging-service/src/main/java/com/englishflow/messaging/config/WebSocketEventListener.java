package com.englishflow.messaging.config;

import com.englishflow.messaging.service.UserPresenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListener {
    
    private final UserPresenceService userPresenceService;
    private final SimpMessagingTemplate messagingTemplate;
    
    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = headerAccessor.getUser();
        
        if (principal != null) {
            try {
                Long userId = Long.parseLong(principal.getName());
                
                // Mark user as online
                userPresenceService.markUserOnline(userId);
                
                // Broadcast online status
                Map<String, Object> presenceUpdate = new HashMap<>();
                presenceUpdate.put("userId", userId);
                presenceUpdate.put("isOnline", true);
                
                messagingTemplate.convertAndSend("/topic/presence", presenceUpdate);
                
                log.info("User {} connected via WebSocket", userId);
            } catch (Exception e) {
                log.error("Error handling WebSocket connection", e);
            }
        }
    }
    
    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = headerAccessor.getUser();
        
        if (principal != null) {
            try {
                Long userId = Long.parseLong(principal.getName());
                
                // Mark user as offline
                userPresenceService.markUserOffline(userId);
                
                // Broadcast offline status
                Map<String, Object> presenceUpdate = new HashMap<>();
                presenceUpdate.put("userId", userId);
                presenceUpdate.put("isOnline", false);
                presenceUpdate.put("lastSeen", userPresenceService.getLastSeen(userId));
                
                messagingTemplate.convertAndSend("/topic/presence", presenceUpdate);
                
                log.info("User {} disconnected from WebSocket", userId);
            } catch (Exception e) {
                log.error("Error handling WebSocket disconnection", e);
            }
        }
    }
}
