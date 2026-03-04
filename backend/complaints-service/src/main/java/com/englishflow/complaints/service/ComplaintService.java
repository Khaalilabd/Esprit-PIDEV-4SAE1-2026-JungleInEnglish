package com.englishflow.complaints.service;

import com.englishflow.complaints.dto.StudentComplaintDTO;
import com.englishflow.complaints.entity.Complaint;
import com.englishflow.complaints.entity.ComplaintNotification;
import com.englishflow.complaints.enums.ComplaintStatus;
import com.englishflow.complaints.repository.ComplaintMessageRepository;
import com.englishflow.complaints.repository.ComplaintNotificationRepository;
import com.englishflow.complaints.repository.ComplaintRepository;
import com.englishflow.complaints.repository.ComplaintWorkflowRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ComplaintService {
    
    private final ComplaintRepository complaintRepository;
    private final ComplaintPriorityService priorityService;
    private final ComplaintMessageRepository messageRepository;
    private final ComplaintWorkflowRepository workflowRepository;
    private final ComplaintNotificationRepository notificationRepository;
    private final NotificationSseService notificationSseService;
    private final RestTemplate restTemplate;
    
    private static final String AUTH_SERVICE_URL = "http://localhost:8081/api/users";
    
    @Transactional
    public Complaint createComplaint(Complaint complaint) {
        log.info("Creating complaint for user: {}", complaint.getUserId());
        
        // Validation métier supplémentaire
        validateComplaint(complaint);
        
        complaint.setStatus(ComplaintStatus.OPEN);
        
        // Calcul automatique de la priorité et du destinataire
        priorityService.calculatePriorityAndTarget(complaint);
        
        Complaint saved = complaintRepository.save(complaint);
        log.info("Complaint created with ID: {} - Priority: {} - Target: {}", 
                 saved.getId(), saved.getPriority(), saved.getTargetRole());
        
        // Create and send notification to target role
        createComplaintNotification(saved);
        
        return saved;
    }
    
    /**
     * Validation métier pour les complaints
     */
    private void validateComplaint(Complaint complaint) {
        // Vérifier que le sujet n'est pas vide après trim
        if (complaint.getSubject() == null || complaint.getSubject().trim().isEmpty()) {
            throw new IllegalArgumentException("Subject cannot be empty");
        }
        
        // Vérifier que la description n'est pas vide après trim
        if (complaint.getDescription() == null || complaint.getDescription().trim().isEmpty()) {
            throw new IllegalArgumentException("Description cannot be empty");
        }
        
        // Vérifier la longueur minimale de la description
        if (complaint.getDescription().trim().length() < 20) {
            throw new IllegalArgumentException("Description must be at least 20 characters long");
        }
        
        // Vérifier que userId est valide
        if (complaint.getUserId() == null || complaint.getUserId() <= 0) {
            throw new IllegalArgumentException("Invalid user ID");
        }
        
        // Vérifier que targetRole est défini
        if (complaint.getTargetRole() == null) {
            throw new IllegalArgumentException("Target role is required");
        }
        
        // Vérifier que category est définie
        if (complaint.getCategory() == null) {
            throw new IllegalArgumentException("Category is required");
        }
        
        // Validation spécifique pour CLUB_SUSPENSION
        if (complaint.getCategory() == com.englishflow.complaints.enums.ComplaintCategory.CLUB_SUSPENSION) {
            if (complaint.getClubId() == null || complaint.getClubId() <= 0) {
                throw new IllegalArgumentException("Club ID is required for club suspension complaints");
            }
        }
        
        // Validation des champs optionnels s'ils sont fournis
        if (complaint.getSessionCount() != null && complaint.getSessionCount() < 0) {
            throw new IllegalArgumentException("Session count cannot be negative");
        }
        
        log.info("Complaint validation passed for user: {}", complaint.getUserId());
    }
    
    private void createComplaintNotification(Complaint complaint) {
        log.info("🔔 Creating notification for complaint: {}", complaint.getId());
        log.info("📧 Target role: {}", complaint.getTargetRole().name());
        
        // Get student name
        String studentName = "Student";
        try {
            Map<String, Object> userInfo = getUserInfo(complaint.getUserId());
            String firstName = (String) userInfo.getOrDefault("firstName", "");
            String lastName = (String) userInfo.getOrDefault("lastName", "");
            studentName = (firstName + " " + lastName).trim();
            if (studentName.isEmpty()) {
                studentName = "Student";
            }
        } catch (Exception e) {
            log.error("Failed to fetch student name for userId: {}", complaint.getUserId(), e);
        }
        
        ComplaintNotification notification = new ComplaintNotification();
        notification.setComplaintId(complaint.getId());
        notification.setRecipientId(0L); // Broadcast to role
        notification.setRecipientRole(complaint.getTargetRole().name());
        notification.setNotificationType("NEW_COMPLAINT");
        notification.setMessage(String.format("New complaint from %s: %s", studentName, complaint.getSubject()));
        notification.setIsRead(false);
        
        ComplaintNotification saved = notificationRepository.save(notification);
        log.info("✅ Notification saved to database with ID: {}", saved.getId());
        log.info("📊 Notification details: recipientRole={}, type={}, message={}", 
                saved.getRecipientRole(), saved.getNotificationType(), saved.getMessage());
        
        // Send real-time notification to all users with target role
        log.info("🚀 Sending SSE notification to role: {}", complaint.getTargetRole().name());
        notificationSseService.sendNotificationToRole(complaint.getTargetRole().name(), saved);
        log.info("✅ SSE notification sent for complaint: {}", complaint.getId());
    }
    
    public List<StudentComplaintDTO> getComplaintsByUserIdWithResponder(Long userId) {
        log.info("Fetching complaints with responder info for user: {}", userId);
        List<Complaint> complaints = complaintRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<StudentComplaintDTO> dtos = new ArrayList<>();
        
        // Enrich complaints with responder username
        for (Complaint complaint : complaints) {
            String responderName = null;
            
            if (complaint.getResponderId() != null && complaint.getResponse() != null) {
                try {
                    Map<String, Object> userInfo = getUserInfo(complaint.getResponderId());
                    String firstName = (String) userInfo.getOrDefault("firstName", "");
                    String lastName = (String) userInfo.getOrDefault("lastName", "");
                    responderName = (firstName + " " + lastName).trim();
                    log.info("Fetched responder name: {} for complaint: {}", responderName, complaint.getId());
                } catch (Exception e) {
                    log.error("Failed to fetch responder info for complaint: {}", complaint.getId(), e);
                }
            }
            
            dtos.add(StudentComplaintDTO.fromComplaint(complaint, responderName));
        }
        
        return dtos;
    }
    
    public List<Complaint> getComplaintsByUserId(Long userId) {
        log.info("Fetching complaints for user: {}", userId);
        return complaintRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
    
    public List<Complaint> getAllComplaints() {
        log.info("Fetching all complaints");
        return complaintRepository.findAllByOrderByCreatedAtDesc();
    }
    
    public Complaint getComplaintById(Long id) {
        log.info("Fetching complaint with ID: {}", id);
        return complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found with ID: " + id));
    }
    
    @Transactional
    public Complaint updateComplaint(Long id, Complaint complaintDetails) {
        log.info("Updating complaint with ID: {}", id);
        
        Complaint complaint = getComplaintById(id);
        
        // Update fields if provided
        if (complaintDetails.getSubject() != null && !complaintDetails.getSubject().isEmpty()) {
            complaint.setSubject(complaintDetails.getSubject());
        }
        
        if (complaintDetails.getDescription() != null && !complaintDetails.getDescription().isEmpty()) {
            complaint.setDescription(complaintDetails.getDescription());
        }
        
        if (complaintDetails.getStatus() != null) {
            complaint.setStatus(complaintDetails.getStatus());
        }
        
        if (complaintDetails.getResponse() != null) {
            complaint.setResponse(complaintDetails.getResponse());
        }
        
        if (complaintDetails.getResponderId() != null) {
            complaint.setResponderId(complaintDetails.getResponderId());
        }
        
        if (complaintDetails.getResponderRole() != null) {
            complaint.setResponderRole(complaintDetails.getResponderRole());
        }
        
        Complaint updated = complaintRepository.save(complaint);
        log.info("Complaint updated successfully: {}", updated.getId());
        return updated;
    }
    
    @Transactional
    public void deleteComplaint(Long id) {
        log.info("Deleting complaint with ID: {} and all related data", id);
        
        // Delete related data first to avoid foreign key constraint violations
        messageRepository.deleteByComplaintId(id);
        log.info("Deleted messages for complaint: {}", id);
        
        workflowRepository.deleteByComplaintId(id);
        log.info("Deleted workflow history for complaint: {}", id);
        
        notificationRepository.deleteByComplaintId(id);
        log.info("Deleted notifications for complaint: {}", id);
        
        // Finally delete the complaint itself
        complaintRepository.deleteById(id);
        log.info("Complaint deleted successfully: {}", id);
    }
    
    public List<Complaint> getComplaintsByStatus(ComplaintStatus status) {
        log.info("Fetching complaints with status: {}", status);
        return complaintRepository.findByStatus(status);
    }
    
    private Map<String, Object> getUserInfo(Long userId) {
        try {
            String url = AUTH_SERVICE_URL + "/" + userId;
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            log.info("Successfully fetched user info for userId: {}", userId);
            return response != null ? response : Map.of("firstName", "Unknown", "lastName", "User");
        } catch (Exception e) {
            log.error("Failed to fetch user info from auth service for userId: {}", userId, e);
            return Map.of("firstName", "Unknown", "lastName", "User");
        }
    }
}

