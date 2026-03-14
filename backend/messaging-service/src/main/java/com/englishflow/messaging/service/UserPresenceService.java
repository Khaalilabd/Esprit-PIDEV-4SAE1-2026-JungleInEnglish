package com.englishflow.messaging.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserPresenceService {
    
    private final RedisTemplate<String, String> redisTemplate;
    
    private static final String ONLINE_USERS_KEY = "messaging:online_users";
    private static final String USER_LAST_SEEN_PREFIX = "messaging:last_seen:";
    private static final long ONLINE_TIMEOUT_SECONDS = 300; // 5 minutes
    
    /**
     * Mark user as online
     */
    public void markUserOnline(Long userId) {
        try {
            String userIdStr = userId.toString();
            
            // Add to online users set with expiration
            redisTemplate.opsForSet().add(ONLINE_USERS_KEY, userIdStr);
            
            // Set expiration on the user's presence
            String userKey = USER_LAST_SEEN_PREFIX + userIdStr;
            redisTemplate.opsForValue().set(
                userKey, 
                LocalDateTime.now().toString(), 
                ONLINE_TIMEOUT_SECONDS, 
                TimeUnit.SECONDS
            );
            
            log.debug("User {} marked as online", userId);
        } catch (Exception e) {
            log.error("Failed to mark user {} as online", userId, e);
        }
    }
    
    /**
     * Mark user as offline
     */
    public void markUserOffline(Long userId) {
        try {
            String userIdStr = userId.toString();
            
            // Remove from online users set
            redisTemplate.opsForSet().remove(ONLINE_USERS_KEY, userIdStr);
            
            // Update last seen timestamp
            String userKey = USER_LAST_SEEN_PREFIX + userIdStr;
            redisTemplate.opsForValue().set(
                userKey, 
                LocalDateTime.now().toString(),
                Duration.ofDays(30) // Keep last seen for 30 days
            );
            
            log.debug("User {} marked as offline", userId);
        } catch (Exception e) {
            log.error("Failed to mark user {} as offline", userId, e);
        }
    }
    
    /**
     * Check if user is online
     */
    public boolean isUserOnline(Long userId) {
        try {
            String userIdStr = userId.toString();
            Boolean isMember = redisTemplate.opsForSet().isMember(ONLINE_USERS_KEY, userIdStr);
            return Boolean.TRUE.equals(isMember);
        } catch (Exception e) {
            // Redis non disponible - retourner false silencieusement
            log.debug("Redis not available, returning offline status for user {}", userId);
            return false;
        }
    }
    
    /**
     * Get all online users
     */
    public Set<Long> getOnlineUsers() {
        try {
            Set<String> onlineUserIds = redisTemplate.opsForSet().members(ONLINE_USERS_KEY);
            if (onlineUserIds == null) {
                return Set.of();
            }
            return onlineUserIds.stream()
                    .map(Long::parseLong)
                    .collect(Collectors.toSet());
        } catch (Exception e) {
            log.error("Failed to get online users", e);
            return Set.of();
        }
    }
    
    /**
     * Get user's last seen timestamp
     */
    public LocalDateTime getLastSeen(Long userId) {
        try {
            String userKey = USER_LAST_SEEN_PREFIX + userId;
            String lastSeenStr = redisTemplate.opsForValue().get(userKey);
            if (lastSeenStr != null) {
                return LocalDateTime.parse(lastSeenStr);
            }
        } catch (Exception e) {
            log.error("Failed to get last seen for user {}", userId, e);
        }
        return null;
    }
    
    /**
     * Refresh user's online status (heartbeat)
     */
    public void refreshUserPresence(Long userId) {
        markUserOnline(userId);
    }
    
    /**
     * Get online status for multiple users
     */
    public Set<Long> filterOnlineUsers(Set<Long> userIds) {
        return userIds.stream()
                .filter(this::isUserOnline)
                .collect(Collectors.toSet());
    }
}
