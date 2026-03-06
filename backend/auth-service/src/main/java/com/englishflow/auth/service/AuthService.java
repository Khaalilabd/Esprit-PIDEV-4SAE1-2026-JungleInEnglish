package com.englishflow.auth.service;

import com.englishflow.auth.dto.AuthResponse;
import com.englishflow.auth.dto.LoginRequest;
import com.englishflow.auth.dto.RegisterRequest;
import com.englishflow.auth.dto.PasswordResetRequest;
import com.englishflow.auth.dto.PasswordResetConfirm;
import com.englishflow.auth.dto.RefreshTokenRequest;
import com.englishflow.auth.dto.RefreshTokenResponse;
import com.englishflow.auth.entity.User;
import com.englishflow.auth.entity.UserSession;
import com.englishflow.auth.entity.PasswordResetToken;
import com.englishflow.auth.entity.ActivationToken;
import com.englishflow.auth.entity.RefreshToken;
import com.englishflow.auth.repository.UserRepository;
import com.englishflow.auth.repository.PasswordResetTokenRepository;
import com.englishflow.auth.repository.ActivationTokenRepository;
import com.englishflow.auth.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final ActivationTokenRepository activationTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;
    private final RateLimitService rateLimitService;
    private final RefreshTokenService refreshTokenService;
    private final AuditLogService auditLogService;
    private final UserSessionService userSessionService;
    private final MetricsService metricsService;
    private final TwoFactorAuthService twoFactorAuthService;
    private final GamificationIntegrationService gamificationIntegrationService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        long startTime = System.currentTimeMillis();
        
        try {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new com.englishflow.auth.exception.EmailAlreadyExistsException(request.getEmail());
            }

            User user = new User();
            user.setEmail(request.getEmail());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setFirstName(request.getFirstName());
            user.setLastName(request.getLastName());
            user.setPhone(request.getPhone());
            user.setRole(User.Role.valueOf(request.getRole().toUpperCase()));
            user.setActive(false); // Account inactive until email verification
            user.setRegistrationFeePaid(false);
            
            // Set CIN if provided
            if (request.getCin() != null && !request.getCin().isEmpty()) {
                user.setCin(request.getCin());
            }
            
            // Map optional fields from RegisterRequest
            if (request.getProfilePhoto() != null && !request.getProfilePhoto().isEmpty()) {
                user.setProfilePhoto(request.getProfilePhoto());
            }
            if (request.getDateOfBirth() != null) {
                user.setDateOfBirth(request.getDateOfBirth().toString());
            }
            if (request.getAddress() != null && !request.getAddress().isEmpty()) {
                user.setAddress(request.getAddress());
            }
            if (request.getCity() != null && !request.getCity().isEmpty()) {
                user.setCity(request.getCity());
            }
            if (request.getPostalCode() != null && !request.getPostalCode().isEmpty()) {
                user.setPostalCode(request.getPostalCode());
            }
            if (request.getBio() != null && !request.getBio().isEmpty()) {
                user.setBio(request.getBio());
            }
            if (request.getEnglishLevel() != null && !request.getEnglishLevel().isEmpty()) {
                user.setEnglishLevel(request.getEnglishLevel());
            }
            if (request.getYearsOfExperience() != null) {
                user.setYearsOfExperience(request.getYearsOfExperience());
            }
            
            // Marquer le profil comme complet si CIN est fourni (champ obligatoire pour inscription manuelle)
            // Pour OAuth2, le profil sera incomplet car pas de CIN
            if (request.getCin() != null && !request.getCin().isEmpty()) {
                user.setProfileCompleted(true);
            } else {
                user.setProfileCompleted(false);
            }

            user = userRepository.save(user);

            // Note: Gamification level will be initialized after the user completes the assessment test
            // The assessment service will call gamification-service to initialize the level

            // Create activation token
            String activationToken = UUID.randomUUID().toString();
            ActivationToken token = ActivationToken.builder()
                    .token(activationToken)
                    .user(user)
                    .expiryDate(LocalDateTime.now().plusHours(24)) // Valid for 24 hours
                    .used(false)
                    .build();
            activationTokenRepository.save(token);

            // Send activation email (ne pas bloquer si ça échoue)
            try {
                emailService.sendActivationEmail(user.getEmail(), user.getFirstName(), activationToken);
            } catch (Exception e) {
                System.err.println("Failed to send activation email: " + e.getMessage());
                // Continue anyway - admin can activate manually
            }
            
            // Record metrics
            metricsService.recordRegistration();
            metricsService.recordRegistrationDuration(System.currentTimeMillis() - startTime);
            
            return AuthResponse.builder()
                    .token(null) // No token until activation
                    .id(user.getId())
                    .email(user.getEmail())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .role(user.getRole().name())
                    .profilePhoto(user.getProfilePhoto())
                    .phone(user.getPhone())
                    .profileCompleted(user.isProfileCompleted())
                    .build();
        } catch (Exception e) {
            metricsService.recordRegistrationDuration(System.currentTimeMillis() - startTime);
            throw e;
        }
    }

    @Transactional
    public AuthResponse activateAccount(String token) {
        ActivationToken activationToken = activationTokenRepository.findByToken(token)
                .orElseThrow(() -> new com.englishflow.auth.exception.InvalidTokenException("Activation", "Token not found"));

        if (activationToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new com.englishflow.auth.exception.TokenExpiredException("Activation");
        }

        if (activationToken.isUsed()) {
            throw new com.englishflow.auth.exception.InvalidTokenException("Activation", "Token already used");
        }

        User user = activationToken.getUser();
        user.setActive(true);
        userRepository.save(user);

        activationToken.setUsed(true);
        activationTokenRepository.save(activationToken);

        // Send welcome email for manual registrations (profile already complete)
        // For OAuth2 users, welcome email is sent after profile completion
        if (user.isProfileCompleted()) {
            try {
                emailService.sendWelcomeEmail(user.getEmail(), user.getFirstName());
                log.info("Welcome email sent to user after activation: {}", user.getEmail());
            } catch (Exception e) {
                log.error("Failed to send welcome email to user: {}", user.getEmail(), e);
            }
        }

        // Generate JWT token
        String jwtToken = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId());

        return new AuthResponse(
                jwtToken,
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole().name(),
                user.getProfilePhoto(),
                user.getPhone(),
                user.isProfileCompleted()
        );
    }

    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        long startTime = System.currentTimeMillis();
        
        try {
            // Check rate limit
            if (rateLimitService.isBlocked(request.getEmail())) {
                metricsService.recordRateLimitExceeded();
                long retryAfter = 900; // 15 minutes in seconds
                throw new com.englishflow.auth.exception.RateLimitExceededException("login", retryAfter);
            }

            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> {
                        rateLimitService.recordFailedAttempt(request.getEmail());
                        metricsService.recordLoginFailure();
                        return new com.englishflow.auth.exception.InvalidCredentialsException();
                    });

            if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                rateLimitService.recordFailedAttempt(request.getEmail());
                metricsService.recordLoginFailure();
                throw new com.englishflow.auth.exception.InvalidCredentialsException();
            }

            if (!user.isActive()) {
                metricsService.recordLoginFailure();
                throw new com.englishflow.auth.exception.AccountNotActivatedException(user.getEmail());
            }

            // Reset rate limit on successful login
            rateLimitService.resetAttempts(request.getEmail());
            
            // Check if 2FA is enabled
            if (twoFactorAuthService.isTwoFactorEnabled(user.getId())) {
                log.info("2FA required for user: {}", user.getEmail());
                
                // Generate temporary token (valid for 5 minutes)
                String tempToken = jwtUtil.generateTempToken(user.getEmail(), user.getId());
                
                metricsService.recordLoginDuration(System.currentTimeMillis() - startTime);
                
                return AuthResponse.builder()
                        .requires2FA(true)
                        .tempToken(tempToken)
                        .email(user.getEmail())
                        .build();
            }
            
            // Record metrics
            metricsService.recordLoginSuccess();
            metricsService.recordLoginDuration(System.currentTimeMillis() - startTime);

            // Create AuthResponse with refresh token
            return createAuthResponse(user, httpRequest);
        } catch (Exception e) {
            metricsService.recordLoginDuration(System.currentTimeMillis() - startTime);
            throw e;
        }
    }

    public boolean validateToken(String token) {
        return jwtUtil.validateToken(token);
    }
    public Map<String, Object> checkActivationStatus(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new com.englishflow.auth.exception.UserNotFoundException("email", email));

        Map<String, Object> response = new HashMap<>();
        response.put("activated", user.isActive());

        if (user.isActive()) {
            // Generate JWT token for activated user
            String jwtToken = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId());
            response.put("token", jwtToken);
            response.put("userId", user.getId());
            response.put("email", user.getEmail());
            response.put("firstName", user.getFirstName());
            response.put("lastName", user.getLastName());
            response.put("role", user.getRole().name());
            response.put("profilePhoto", user.getProfilePhoto());
            response.put("profileCompleted", user.isProfileCompleted());
            response.put("message", "Account activated successfully!");
        } else {
            response.put("message", "Waiting for account activation...");
        }

        return response;
    }


    @Transactional
    public void requestPasswordReset(PasswordResetRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new com.englishflow.auth.exception.UserNotFoundException("email", request.getEmail()));

        // Create new reset token
        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiryDate(LocalDateTime.now().plusHours(1)) // Token valid for 1 hour
                .used(false)
                .build();

        passwordResetTokenRepository.save(resetToken);

        // Send email
        emailService.sendPasswordResetEmail(user.getEmail(), user.getFirstName(), token);
    }

    @Transactional
    public void resetPassword(PasswordResetConfirm request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new com.englishflow.auth.exception.InvalidTokenException("Password reset", "Token not found"));

        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new com.englishflow.auth.exception.TokenExpiredException("Password reset");
        }

        if (resetToken.getUsed()) {
            throw new com.englishflow.auth.exception.InvalidTokenException("Password reset", "Token already used");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);
    }
    @Transactional
    public void completeProfile(Long userId, Map<String, String> profileData) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new com.englishflow.auth.exception.UserNotFoundException(userId));

        // Update optional fields
        if (profileData.containsKey("phone") && profileData.get("phone") != null) {
            user.setPhone(profileData.get("phone"));
        }
        if (profileData.containsKey("cin") && profileData.get("cin") != null) {
            user.setCin(profileData.get("cin"));
        }
        if (profileData.containsKey("dateOfBirth") && profileData.get("dateOfBirth") != null) {
            user.setDateOfBirth(profileData.get("dateOfBirth"));
        }
        if (profileData.containsKey("address") && profileData.get("address") != null) {
            user.setAddress(profileData.get("address"));
        }
        if (profileData.containsKey("city") && profileData.get("city") != null) {
            user.setCity(profileData.get("city"));
        }
        if (profileData.containsKey("postalCode") && profileData.get("postalCode") != null) {
            user.setPostalCode(profileData.get("postalCode"));
        }
        if (profileData.containsKey("bio") && profileData.get("bio") != null) {
            user.setBio(profileData.get("bio"));
        }
        if (profileData.containsKey("englishLevel") && profileData.get("englishLevel") != null) {
            user.setEnglishLevel(profileData.get("englishLevel"));
        }

        // Mark profile as completed (account is already activated via email link)
        user.setProfileCompleted(true);
        userRepository.save(user);
        
        // Send welcome email only after profile completion
        try {
            emailService.sendWelcomeEmail(user.getEmail(), user.getFirstName());
            log.info("Welcome email sent to user: {}", user.getEmail());
        } catch (Exception e) {
            log.error("Failed to send welcome email to user: {}", user.getEmail(), e);
        }
    }

    /**
     * Create AuthResponse with both access and refresh tokens
     */
    private AuthResponse createAuthResponse(User user, HttpServletRequest request) {
        String accessToken = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId());
        
        // Extract device info and IP address
        String deviceInfo = extractDeviceInfo(request);
        String ipAddress = extractIpAddress(request);
        
        // Create refresh token
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId(), deviceInfo, ipAddress);
        
        // Create user session and get session token
        String sessionToken = null;
        try {
            log.info("Attempting to create session for user: {} (ID: {})", user.getEmail(), user.getId());
            UserSession session = userSessionService.createSession(user.getId(), request);
            sessionToken = session.getSessionToken();
            log.info("Session created successfully for user: {} with token: {}", user.getEmail(), sessionToken);
        } catch (Exception e) {
            log.error("Failed to create session for user: {} - Error: {}", user.getEmail(), e.getMessage(), e);
            // Continue anyway - session tracking is not critical for login
        }
        
        return AuthResponse.builder()
                .token(accessToken)
                .refreshToken(refreshToken.getToken())
                .sessionToken(sessionToken)
                .type("Bearer")
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole().name())
                .profilePhoto(user.getProfilePhoto())
                .phone(user.getPhone())
                .profileCompleted(user.isProfileCompleted())
                .expiresIn(jwtUtil.getExpirationTimeInSeconds())
                .refreshTokenExpiryDate(refreshToken.getExpiryDate())
                .build();
    }

    /**
     * Refresh access token using refresh token
     */
    @Transactional
    public RefreshTokenResponse refreshToken(RefreshTokenRequest request, HttpServletRequest httpRequest) {
        String requestRefreshToken = request.getRefreshToken();
        
        RefreshToken refreshToken = refreshTokenService.findByToken(requestRefreshToken)
                .orElseThrow(() -> new com.englishflow.auth.exception.InvalidTokenException("Refresh", "Token not found"));
        
        RefreshToken verifiedToken = refreshTokenService.verifyExpiration(refreshToken);
        
        User user = userRepository.findById(verifiedToken.getUserId())
                .orElseThrow(() -> new com.englishflow.auth.exception.UserNotFoundException(verifiedToken.getUserId()));
        
        // Generate new access token
        String newAccessToken = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId());
        
        // Create new refresh token (token rotation for security)
        String deviceInfo = extractDeviceInfo(httpRequest);
        String ipAddress = extractIpAddress(httpRequest);
        RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(user.getId(), deviceInfo, ipAddress);
        
        // Revoke old refresh token
        refreshTokenService.revokeToken(requestRefreshToken);
        
        return new RefreshTokenResponse(
                newAccessToken,
                newRefreshToken.getToken(),
                "Bearer",
                jwtUtil.getExpirationTimeInSeconds(),
                newRefreshToken.getExpiryDate()
        );
    }

    /**
     * Logout user by revoking refresh token
     */
    @Transactional
    public void logout(String refreshToken) {
        if (refreshToken != null) {
            refreshTokenService.revokeToken(refreshToken);
        }
    }

    /**
     * Logout user from all devices
     */
    @Transactional
    public void logoutFromAllDevices(Long userId) {
        refreshTokenService.revokeAllUserTokens(userId);
    }

    /**
     * Extract device information from request
     */
    private String extractDeviceInfo(HttpServletRequest request) {
        String userAgent = request.getHeader("User-Agent");
        return userAgent != null ? userAgent : "Unknown Device";
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
     * Verify 2FA code during login
     */
    @Transactional
    public AuthResponse verifyTwoFactorLogin(String tempToken, String code, HttpServletRequest request) {
        long startTime = System.currentTimeMillis();
        
        try {
            // Validate temporary token
            if (!jwtUtil.validateTempToken(tempToken)) {
                metricsService.recordLoginFailure();
                throw new com.englishflow.auth.exception.InvalidTokenException("2FA", "Temporary token expired or invalid");
            }
            
            // Extract user info from temp token
            String email = jwtUtil.extractEmailFromToken(tempToken);
            Long userId = jwtUtil.extractUserIdFromToken(tempToken);
            
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new com.englishflow.auth.exception.UserNotFoundException(userId));
            
            // Verify 2FA code
            if (!twoFactorAuthService.verifyTwoFactorCode(userId, code)) {
                metricsService.recordLoginFailure();
                throw new com.englishflow.auth.exception.InvalidTokenException("2FA", "Invalid verification code");
            }
            
            // Record successful login
            metricsService.recordLoginSuccess();
            metricsService.recordLoginDuration(System.currentTimeMillis() - startTime);
            
            log.info("2FA verification successful for user: {}", email);
            
            // Create full auth response with tokens
            return createAuthResponse(user, request);
        } catch (Exception e) {
            metricsService.recordLoginDuration(System.currentTimeMillis() - startTime);
            throw e;
        }
    }

}
