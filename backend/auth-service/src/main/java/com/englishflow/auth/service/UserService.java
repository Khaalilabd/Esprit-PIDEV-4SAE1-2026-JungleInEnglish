package com.englishflow.auth.service;

import com.englishflow.auth.dto.CreateTutorRequest;
import com.englishflow.auth.dto.UpdateUserRequest;
import com.englishflow.auth.dto.UserDTO;
import com.englishflow.auth.entity.ActivationToken;
import com.englishflow.auth.entity.User;
import com.englishflow.auth.repository.ActivationTokenRepository;
import com.englishflow.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final GamificationIntegrationService gamificationIntegrationService;
    private final ActivationTokenRepository activationTokenRepository;

    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public Page<UserDTO> getAllUsersPaginated(Pageable pageable) {
        return userRepository.findAll(pageable)
                .map(UserDTO::fromEntity);
    }

    @Cacheable(value = "users", key = "#id")
    public UserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new com.englishflow.auth.exception.UserNotFoundException(id));
        UserDTO userDTO = UserDTO.fromEntity(user);
        
        // Fetch gamification level
        try {
            userDTO.setGamificationLevel(gamificationIntegrationService.getUserLevel(id));
        } catch (Exception e) {
            log.error("Failed to fetch gamification level for user {}: {}", id, e.getMessage());
        }
        
        return userDTO;
    }

    public List<UserDTO> getUsersByRole(String role) {
        User.Role userRole;
        try {
            userRole = User.Role.valueOf(role.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid role: " + role);
        }

        return userRepository.findByRole(userRole).stream()
                .map(UserDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "users", key = "#id"),
        @CacheEvict(value = "usersByEmail", allEntries = true)
    })
    public UserDTO updateUser(Long id, UserDTO userDTO) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new com.englishflow.auth.exception.UserNotFoundException(id));

        // Update only non-null fields
        if (userDTO.getFirstName() != null) user.setFirstName(userDTO.getFirstName());
        if (userDTO.getLastName() != null) user.setLastName(userDTO.getLastName());
        if (userDTO.getPhone() != null) user.setPhone(userDTO.getPhone());
        if (userDTO.getCin() != null) user.setCin(userDTO.getCin());
        if (userDTO.getProfilePhoto() != null) user.setProfilePhoto(userDTO.getProfilePhoto());
        if (userDTO.getDateOfBirth() != null) user.setDateOfBirth(userDTO.getDateOfBirth());
        if (userDTO.getAddress() != null) user.setAddress(userDTO.getAddress());
        if (userDTO.getCity() != null) user.setCity(userDTO.getCity());
        if (userDTO.getPostalCode() != null) user.setPostalCode(userDTO.getPostalCode());
        if (userDTO.getBio() != null) user.setBio(userDTO.getBio());
        if (userDTO.getEnglishLevel() != null) user.setEnglishLevel(userDTO.getEnglishLevel());
        if (userDTO.getYearsOfExperience() != null) user.setYearsOfExperience(userDTO.getYearsOfExperience());
        user.setActive(userDTO.isActive());
        user.setRegistrationFeePaid(userDTO.isRegistrationFeePaid());

        User updatedUser = userRepository.save(user);
        return UserDTO.fromEntity(updatedUser);
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "users", key = "#id"),
        @CacheEvict(value = "usersByEmail", allEntries = true)
    })
    public UserDTO updateUserByAdmin(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new com.englishflow.auth.exception.UserNotFoundException(id));

        // Update only non-null fields from UpdateUserRequest
        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        if (request.getEmail() != null) user.setEmail(request.getEmail());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getCin() != null) user.setCin(request.getCin());
        if (request.getProfilePhoto() != null) user.setProfilePhoto(request.getProfilePhoto());
        if (request.getDateOfBirth() != null) user.setDateOfBirth(request.getDateOfBirth());
        if (request.getAddress() != null) user.setAddress(request.getAddress());
        if (request.getCity() != null) user.setCity(request.getCity());
        if (request.getPostalCode() != null) user.setPostalCode(request.getPostalCode());
        if (request.getBio() != null) user.setBio(request.getBio());
        if (request.getEnglishLevel() != null) user.setEnglishLevel(request.getEnglishLevel());
        if (request.getYearsOfExperience() != null) user.setYearsOfExperience(request.getYearsOfExperience());

        User updatedUser = userRepository.save(user);
        return UserDTO.fromEntity(updatedUser);
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "users", key = "#id"),
        @CacheEvict(value = "usersByEmail", allEntries = true)
    })
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new com.englishflow.auth.exception.UserNotFoundException(id);
        }
        
        // Delete all activation tokens associated with this user first
        activationTokenRepository.deleteByUserId(id);
        
        // Now delete the user
        userRepository.deleteById(id);
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "users", key = "#id"),
        @CacheEvict(value = "usersByEmail", allEntries = true)
    })
    public UserDTO toggleUserStatus(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new com.englishflow.auth.exception.UserNotFoundException(id));
        
        user.setActive(!user.isActive());
        User updatedUser = userRepository.save(user);
        return UserDTO.fromEntity(updatedUser);
    }

    @Transactional
    public UserDTO createTutor(CreateTutorRequest request) {
        // Validate request
        if (request.getEmail() == null || request.getEmail().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (request.getPassword() == null || request.getPassword().isEmpty()) {
            throw new IllegalArgumentException("Password is required");
        }
        
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new com.englishflow.auth.exception.EmailAlreadyExistsException(request.getEmail());
        }

        // Check if CIN already exists
        if (request.getCin() != null && !request.getCin().isEmpty()) {
            userRepository.findAll().stream()
                .filter(u -> request.getCin().equals(u.getCin()))
                .findFirst()
                .ifPresent(u -> {
                    throw new IllegalArgumentException("CIN already exists: " + request.getCin());
                });
        }

            // Create new tutor user
            User tutor = new User();
            tutor.setFirstName(request.getFirstName());
            tutor.setLastName(request.getLastName());
            tutor.setEmail(request.getEmail());
            tutor.setPhone(request.getPhone());
            tutor.setCin(request.getCin());
            tutor.setDateOfBirth(request.getDateOfBirth());
            tutor.setAddress(request.getAddress());
            tutor.setCity(request.getCity());
            tutor.setPostalCode(request.getPostalCode());
            tutor.setYearsOfExperience(request.getYearsOfExperience());
            tutor.setBio(request.getBio());
            tutor.setRole(User.Role.TUTOR);
            tutor.setActive(true);
            tutor.setRegistrationFeePaid(false);
            
            // Encode password
            tutor.setPassword(passwordEncoder.encode(request.getPassword()));

            User savedTutor = userRepository.save(tutor);
            return UserDTO.fromEntity(savedTutor);
    }

    @Transactional
    public UserDTO createUser(CreateTutorRequest request) {
        // Validate request
        if (request.getEmail() == null || request.getEmail().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (request.getPassword() == null || request.getPassword().isEmpty()) {
            throw new IllegalArgumentException("Password is required");
        }
        if (request.getRole() == null || request.getRole().isEmpty()) {
            throw new IllegalArgumentException("Role is required");
        }
        
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new com.englishflow.auth.exception.EmailAlreadyExistsException(request.getEmail());
        }

        // Check if CIN already exists
        if (request.getCin() != null && !request.getCin().isEmpty()) {
            userRepository.findAll().stream()
                .filter(u -> request.getCin().equals(u.getCin()))
                .findFirst()
                .ifPresent(u -> {
                    throw new IllegalArgumentException("CIN already exists: " + request.getCin());
                });
        }

        // Parse role
        User.Role userRole;
        try {
            userRole = User.Role.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid role: " + request.getRole());
        }

            // Create new user
            User user = new User();
            user.setFirstName(request.getFirstName());
            user.setLastName(request.getLastName());
            user.setEmail(request.getEmail());
            user.setPhone(request.getPhone());
            user.setCin(request.getCin());
            user.setDateOfBirth(request.getDateOfBirth());
            user.setAddress(request.getAddress());
            user.setCity(request.getCity());
            user.setPostalCode(request.getPostalCode());
            user.setYearsOfExperience(request.getYearsOfExperience());
            user.setBio(request.getBio());
            user.setEnglishLevel(request.getEnglishLevel());
            user.setRole(userRole);
            user.setActive(false); // Require email activation
            user.setRegistrationFeePaid(false);
            
            // Encode password
            user.setPassword(passwordEncoder.encode(request.getPassword()));

            User savedUser = userRepository.save(user);
            
            // Create activation token
            String activationToken = UUID.randomUUID().toString();
            ActivationToken token = ActivationToken.builder()
                    .token(activationToken)
                    .user(savedUser)
                    .expiryDate(LocalDateTime.now().plusHours(24))
                    .used(false)
                    .build();
            activationTokenRepository.save(token);
            
            // Send account created email with activation link (NO PASSWORD)
            try {
                emailService.sendActivationEmail(
                    savedUser.getEmail(), 
                    savedUser.getFirstName(), 
                    activationToken
                );
                log.info("Account created email sent to: {}", savedUser.getEmail());
            } catch (Exception e) {
                log.error("Failed to send account created email to {}: {}", savedUser.getEmail(), e.getMessage());
                // Continue anyway - admin can activate manually
            }
            
            return UserDTO.fromEntity(savedUser);
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "users", key = "#id"),
        @CacheEvict(value = "usersByEmail", allEntries = true)
    })
    public UserDTO activateUser(Long id) {
        System.out.println("📝 UserService.activateUser called with ID: " + id);
        
        User user = userRepository.findById(id)
                .orElseThrow(() -> new com.englishflow.auth.exception.UserNotFoundException(id));
        
        System.out.println("👤 Found user: " + user.getEmail() + ", current status: " + user.isActive());
        
        boolean wasInactive = !user.isActive();
        user.setActive(true);
        System.out.println("✏️ Setting user to active...");
        
        User updatedUser = userRepository.save(user);
        System.out.println("💾 User saved, new status: " + updatedUser.isActive());
        
        // Send welcome email if user was previously inactive
        if (wasInactive) {
            try {
                emailService.sendWelcomeEmail(updatedUser.getEmail(), updatedUser.getFirstName());
                System.out.println("✅ Welcome email sent to: " + updatedUser.getEmail());
            } catch (Exception e) {
                System.err.println("❌ Failed to send welcome email: " + e.getMessage());
            }
        }
        
        UserDTO dto = UserDTO.fromEntity(updatedUser);
        System.out.println("📦 DTO created successfully");
        
        return dto;
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "users", key = "#id"),
        @CacheEvict(value = "usersByEmail", allEntries = true)
    })
    public UserDTO deactivateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new com.englishflow.auth.exception.UserNotFoundException(id));
        
        user.setActive(false);
        User updatedUser = userRepository.save(user);
        return UserDTO.fromEntity(updatedUser);
    }
}
