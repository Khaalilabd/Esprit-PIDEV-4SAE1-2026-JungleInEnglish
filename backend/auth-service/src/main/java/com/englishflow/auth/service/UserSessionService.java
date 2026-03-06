package com.englishflow.auth.service;

import com.englishflow.auth.entity.User;
import com.englishflow.auth.entity.UserSession;
import com.englishflow.auth.repository.UserRepository;
import com.englishflow.auth.repository.UserSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserSessionService {

    private final UserSessionRepository userSessionRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final GeoIpService geoIpService;
    
    // Configuration constants
    private static final int MAX_CONCURRENT_SESSIONS = 5;
    private static final int INACTIVITY_TIMEOUT_MINUTES = 30;
    private static final int SESSION_CLEANUP_DAYS = 30;
    private static final int SUSPICIOUS_SESSIONS_THRESHOLD = 10;
    private static final int RECENT_SESSIONS_WINDOW_HOURS = 1;
    private static final int SESSION_EXPIRY_DAYS = 7;

    /**
     * Create a new user session
     */
    @Transactional
    public UserSession createSession(Long userId, HttpServletRequest request) {
        // Check concurrent session limit
        Long activeSessionCount = userSessionRepository.countActiveSessionsByUserId(userId);
        if (activeSessionCount >= MAX_CONCURRENT_SESSIONS) {
            // Terminate oldest session
            List<UserSession> activeSessions = userSessionRepository.findActiveSessionsByUserId(userId);
            if (!activeSessions.isEmpty()) {
                UserSession oldestSession = activeSessions.get(activeSessions.size() - 1);
                terminateSession(oldestSession.getId(), UserSession.TerminationReason.CONCURRENT_LOGIN_LIMIT);
            }
        }

        // Extract device and location information
        DeviceInfo deviceInfo = extractDeviceInfo(request);
        LocationInfo locationInfo = extractLocationInfo(request);

        // Create new session
        UserSession session = UserSession.builder()
                .userId(userId)
                .sessionToken(generateSessionToken())
                .deviceInfo(request.getHeader("User-Agent"))
                .browserName(deviceInfo.getBrowserName())
                .browserVersion(deviceInfo.getBrowserVersion())
                .operatingSystem(deviceInfo.getOperatingSystem())
                .deviceType(deviceInfo.getDeviceType())
                .ipAddress(extractIpAddress(request))
                .country(locationInfo.getCountry())
                .city(locationInfo.getCity())
                .isp(locationInfo.getIsp())
                .status(UserSession.SessionStatus.ACTIVE)
                .expiresAt(LocalDateTime.now().plusDays(SESSION_EXPIRY_DAYS))
                .build();

        // Check for suspicious activity
        checkSuspiciousActivity(session, request);

        session = userSessionRepository.save(session);
        log.info("Created new session {} for user {}", session.getSessionToken(), userId);

        return session;
    }

    /**
     * Update session activity
     */
    @Async
    @Transactional
    public void updateSessionActivity(String sessionToken) {
        userSessionRepository.findBySessionToken(sessionToken)
                .ifPresent(session -> {
                    session.updateActivity();
                    userSessionRepository.save(session);
                });
    }

    /**
     * Get active sessions for a user
     */
    public List<UserSession> getActiveUserSessions(Long userId) {
        return userSessionRepository.findActiveSessionsByUserId(userId);
    }

    /**
     * Get all sessions for a user with pagination
     */
    public Page<UserSession> getUserSessions(Long userId, Pageable pageable) {
        return userSessionRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    /**
     * Terminate a specific session
     */
    @Transactional
    public boolean terminateSession(Long sessionId, UserSession.TerminationReason reason) {
        Optional<UserSession> sessionOpt = userSessionRepository.findById(sessionId);
        if (sessionOpt.isPresent()) {
            UserSession session = sessionOpt.get();
            session.terminate(reason);
            userSessionRepository.save(session);
            
            log.info("Terminated session {} for user {} - Reason: {}", 
                    session.getSessionToken(), session.getUserId(), reason);
            return true;
        }
        return false;
    }

    /**
     * Terminate all sessions for a user
     */
    @Transactional
    public int terminateAllUserSessions(Long userId, UserSession.TerminationReason reason) {
        int terminatedCount = userSessionRepository.terminateAllUserSessions(
                userId, reason, LocalDateTime.now());
        
        log.info("Terminated {} sessions for user {} - Reason: {}", 
                terminatedCount, userId, reason);
        return terminatedCount;
    }

    /**
     * Get session by token
     */
    public Optional<UserSession> getSessionByToken(String sessionToken) {
        return userSessionRepository.findBySessionToken(sessionToken);
    }

    /**
     * Search sessions with filters
     */
    public Page<UserSession> searchSessions(Long userId, UserSession.SessionStatus status,
                                          String deviceType, String ipAddress, String country,
                                          Boolean suspicious, LocalDateTime startDate,
                                          LocalDateTime endDate, Pageable pageable) {
        // Use different query based on whether date filters are present
        if (startDate != null && endDate != null) {
            return userSessionRepository.searchSessionsWithDateRange(userId, status, deviceType, 
                    ipAddress, country, suspicious, startDate, endDate, pageable);
        } else {
            return userSessionRepository.searchSessionsBasic(userId, status, deviceType, 
                    ipAddress, country, suspicious, pageable);
        }
    }

    /**
     * Get suspicious sessions
     */
    public List<UserSession> getSuspiciousSessions() {
        return userSessionRepository.findSuspiciousSessions();
    }

    /**
     * Get session statistics for dashboard
     */
    public Map<String, Object> getSessionStatistics(int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        
        List<Object[]> statusStats = userSessionRepository.getSessionStatistics(since);
        List<Object[]> deviceStats = userSessionRepository.getDeviceStatistics(since);
        List<Object[]> geoStats = userSessionRepository.getGeographicStatistics(since);
        
        Map<String, Long> statusMap = statusStats.stream()
                .collect(Collectors.toMap(
                    row -> ((UserSession.SessionStatus) row[0]).name(),
                    row -> (Long) row[1]
                ));
        
        Map<String, Long> deviceMap = deviceStats.stream()
                .collect(Collectors.toMap(
                    row -> (String) row[0],
                    row -> (Long) row[1]
                ));
        
        Map<String, Long> geoMap = geoStats.stream()
                .limit(10) // Top 10 countries
                .collect(Collectors.toMap(
                    row -> (String) row[0],
                    row -> (Long) row[1]
                ));

        return Map.of(
            "statusStatistics", statusMap,
            "deviceStatistics", deviceMap,
            "geographicStatistics", geoMap,
            "totalActiveSessions", statusMap.getOrDefault("ACTIVE", 0L),
            "suspiciousSessions", userSessionRepository.findSuspiciousSessions().size()
        );
    }

    /**
     * Scheduled task to cleanup inactive and expired sessions
     */
    @Scheduled(fixedRate = 300000) // Every 5 minutes
    @Transactional
    public void cleanupSessions() {
        LocalDateTime now = LocalDateTime.now();
        
        // Mark inactive sessions
        LocalDateTime inactivityCutoff = now.minusMinutes(INACTIVITY_TIMEOUT_MINUTES);
        List<UserSession> inactiveSessions = userSessionRepository.findInactiveSessions(inactivityCutoff);
        if (!inactiveSessions.isEmpty()) {
            List<Long> inactiveIds = inactiveSessions.stream()
                    .map(UserSession::getId)
                    .collect(Collectors.toList());
            userSessionRepository.markSessionsAsInactive(inactiveIds);
            log.info("Marked {} sessions as inactive", inactiveIds.size());
        }
        
        // Mark expired sessions
        List<UserSession> expiredSessions = userSessionRepository.findExpiredSessions(now);
        if (!expiredSessions.isEmpty()) {
            List<Long> expiredIds = expiredSessions.stream()
                    .map(UserSession::getId)
                    .collect(Collectors.toList());
            userSessionRepository.markSessionsAsExpired(expiredIds);
            log.info("Marked {} sessions as expired", expiredIds.size());
        }
    }

    /**
     * Scheduled task to delete old terminated sessions
     */
    @Scheduled(cron = "0 0 3 * * ?") // Daily at 3 AM
    @Transactional
    public void deleteOldSessions() {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(SESSION_CLEANUP_DAYS);
        int deletedCount = userSessionRepository.deleteOldTerminatedSessions(cutoffDate);
        log.info("Deleted {} old terminated sessions", deletedCount);
    }

    /**
     * Check for suspicious activity patterns
     */
    private void checkSuspiciousActivity(UserSession session, HttpServletRequest request) {
        String ipAddress = session.getIpAddress();
        LocalDateTime recentWindow = LocalDateTime.now().minusHours(RECENT_SESSIONS_WINDOW_HOURS);
        
        // Check for multiple sessions from same IP
        List<UserSession> recentSessions = userSessionRepository.findRecentSessionsByIp(ipAddress, recentWindow);
        if (recentSessions.size() > SUSPICIOUS_SESSIONS_THRESHOLD) {
            session.markSuspicious("Multiple sessions from same IP address in short time");
            log.warn("Suspicious activity detected: Multiple sessions from IP {}", ipAddress);
        }
        
        // Check for unusual device/location combination
        if (isUnusualDeviceLocation(session)) {
            session.markSuspicious("Unusual device/location combination");
            log.warn("Suspicious activity detected: Unusual device/location for user {}", session.getUserId());
        }
    }

    /**
     * Check if device/location combination is unusual
     */
    private boolean isUnusualDeviceLocation(UserSession session) {
        // Simple heuristic - in production, this would use ML models
        // For now, just check if it's a new country for the user
        List<UserSession> userSessions = userSessionRepository.findActiveSessionsByUserId(session.getUserId());
        
        if (session.getCountry() != null && !userSessions.isEmpty()) {
            boolean hasSessionsInSameCountry = userSessions.stream()
                    .anyMatch(s -> session.getCountry().equals(s.getCountry()));
            return !hasSessionsInSameCountry;
        }
        
        return false;
    }

    /**
     * Generate unique session token
     */
    private String generateSessionToken() {
        return "sess_" + UUID.randomUUID().toString().replace("-", "");
    }

    /**
     * Extract IP address from request
     */
    private String extractIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }

    /**
     * Extract device information from User-Agent
     */
    private DeviceInfo extractDeviceInfo(HttpServletRequest request) {
        String userAgent = request.getHeader("User-Agent");
        if (userAgent == null) {
            return new DeviceInfo("Unknown", "Unknown", "Unknown", "UNKNOWN");
        }

        DeviceInfo deviceInfo = new DeviceInfo();
        
        // Extract browser information
        if (userAgent.contains("Chrome")) {
            deviceInfo.setBrowserName("Chrome");
            Pattern pattern = Pattern.compile("Chrome/([\\d.]+)");
            Matcher matcher = pattern.matcher(userAgent);
            if (matcher.find()) {
                deviceInfo.setBrowserVersion(matcher.group(1));
            }
        } else if (userAgent.contains("Firefox")) {
            deviceInfo.setBrowserName("Firefox");
            Pattern pattern = Pattern.compile("Firefox/([\\d.]+)");
            Matcher matcher = pattern.matcher(userAgent);
            if (matcher.find()) {
                deviceInfo.setBrowserVersion(matcher.group(1));
            }
        } else if (userAgent.contains("Safari") && !userAgent.contains("Chrome")) {
            deviceInfo.setBrowserName("Safari");
            Pattern pattern = Pattern.compile("Version/([\\d.]+)");
            Matcher matcher = pattern.matcher(userAgent);
            if (matcher.find()) {
                deviceInfo.setBrowserVersion(matcher.group(1));
            }
        } else {
            deviceInfo.setBrowserName("Other");
            deviceInfo.setBrowserVersion("Unknown");
        }

        // Extract OS information
        if (userAgent.contains("Windows")) {
            deviceInfo.setOperatingSystem("Windows");
            deviceInfo.setDeviceType("DESKTOP");
        } else if (userAgent.contains("Mac OS")) {
            deviceInfo.setOperatingSystem("macOS");
            deviceInfo.setDeviceType("DESKTOP");
        } else if (userAgent.contains("Linux")) {
            deviceInfo.setOperatingSystem("Linux");
            deviceInfo.setDeviceType("DESKTOP");
        } else if (userAgent.contains("Android")) {
            deviceInfo.setOperatingSystem("Android");
            deviceInfo.setDeviceType(userAgent.contains("Mobile") ? "MOBILE" : "TABLET");
        } else if (userAgent.contains("iOS") || userAgent.contains("iPhone") || userAgent.contains("iPad")) {
            deviceInfo.setOperatingSystem("iOS");
            deviceInfo.setDeviceType(userAgent.contains("iPad") ? "TABLET" : "MOBILE");
        } else {
            deviceInfo.setOperatingSystem("Unknown");
            deviceInfo.setDeviceType("UNKNOWN");
        }

        return deviceInfo;
    }

    /**
     * Extract location information from IP (using GeoIP service)
     */
    private LocationInfo extractLocationInfo(HttpServletRequest request) {
        String ipAddress = extractIpAddress(request);
        GeoIpService.LocationInfo geoInfo = geoIpService.getLocationInfo(ipAddress);
        
        return new LocationInfo(
            geoInfo.getCountry(),
            geoInfo.getCity(),
            geoInfo.getIsp()
        );
    }

    // Helper classes
    @lombok.Data
    @lombok.AllArgsConstructor
    @lombok.NoArgsConstructor
    public static class DeviceInfo {
        private String browserName;
        private String browserVersion;
        private String operatingSystem;
        private String deviceType;
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    @lombok.NoArgsConstructor
    public static class LocationInfo {
        private String country;
        private String city;
        private String isp;
    }
}