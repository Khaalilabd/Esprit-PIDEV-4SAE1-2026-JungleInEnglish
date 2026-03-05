package com.englishflow.complaints.service;

import com.englishflow.complaints.dto.ComplaintWorkflowDTO;
import com.englishflow.complaints.entity.Complaint;
import com.englishflow.complaints.entity.ComplaintNotification;
import com.englishflow.complaints.entity.ComplaintWorkflow;
import com.englishflow.complaints.enums.ComplaintStatus;
import com.englishflow.complaints.repository.ComplaintNotificationRepository;
import com.englishflow.complaints.repository.ComplaintWorkflowRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ComplaintWorkflowService {
    
    private final ComplaintWorkflowRepository workflowRepository;
    private final ComplaintNotificationRepository notificationRepository;
    private final NotificationSseService notificationSseService;
    private final RestTemplate restTemplate;
    
    @Value("${auth.service.url}")
    private String authServiceUrl;
    
    @Transactional
    public void recordStatusChange(Complaint complaint, ComplaintStatus oldStatus, 
                                   Long actorId, String actorRole, String comment) {
        ComplaintWorkflow workflow = new ComplaintWorkflow();
        workflow.setComplaintId(complaint.getId());
        workflow.setFromStatus(oldStatus);
        workflow.setToStatus(complaint.getStatus());
        workflow.setActorId(actorId);
        workflow.setActorRole(actorRole);
        workflow.setComment(comment);
        
        // Check if this is an escalation
        if (isEscalation(oldStatus, complaint.getStatus())) {
            workflow.setIsEscalation(true);
            workflow.setEscalationReason("Status escalated from " + oldStatus + " to " + complaint.getStatus());
        }
        
        workflowRepository.save(workflow);
        log.info("Workflow recorded for complaint {} - {} -> {}", 
                 complaint.getId(), oldStatus, complaint.getStatus());
        
        // Create notification
        createNotification(complaint, actorId, actorRole, workflow.getIsEscalation());
    }
    
    private boolean isEscalation(ComplaintStatus from, ComplaintStatus to) {
        // Escalation if moving from resolved/rejected back to open/in_progress
        return (from == ComplaintStatus.RESOLVED || from == ComplaintStatus.REJECTED) &&
               (to == ComplaintStatus.OPEN || to == ComplaintStatus.IN_PROGRESS);
    }
    
    private void createNotification(Complaint complaint, Long actorId, String actorRole, boolean isEscalation) {
        try {
            ComplaintNotification notification = new ComplaintNotification();
            notification.setComplaintId(complaint.getId());
            notification.setRecipientId(complaint.getUserId());
            notification.setRecipientRole("STUDENT");
            
            if (isEscalation) {
                notification.setNotificationType("ESCALATION");
                notification.setMessage(String.format("Your complaint '%s' has been escalated for review", complaint.getSubject()));
            } else if (complaint.getStatus() == ComplaintStatus.NOTED) {
                notification.setNotificationType("NOTED");
                notification.setMessage(String.format("Your tutor has noted your complaint: '%s'", complaint.getSubject()));
            } else {
                notification.setNotificationType("STATUS_CHANGE");
                notification.setMessage(String.format("Your complaint '%s' status changed to %s", complaint.getSubject(), complaint.getStatus()));
            }
            
            notification.setIsRead(false);
            ComplaintNotification saved = notificationRepository.save(notification);
            log.info("Notification saved to database for userId: {}", complaint.getUserId());
            
            // Send real-time notification via SSE - don't fail if this fails
            try {
                notificationSseService.sendNotificationToUser(complaint.getUserId(), saved);
                log.info("Real-time notification sent to student userId: {}", complaint.getUserId());
            } catch (Exception e) {
                log.warn("Failed to send real-time notification via SSE, but notification was saved to database", e);
            }
        } catch (Exception e) {
            log.error("Error creating notification for complaint {}", complaint.getId(), e);
            // Don't throw - notification failure shouldn't fail the whole workflow
        }
    }
    
    public List<ComplaintWorkflow> getComplaintHistory(Long complaintId) {
        return workflowRepository.findByComplaintIdOrderByTimestampDesc(complaintId);
    }
    
    public List<ComplaintWorkflowDTO> getComplaintHistoryWithActorNames(Long complaintId) {
        List<ComplaintWorkflow> workflows = workflowRepository.findByComplaintIdOrderByTimestampDesc(complaintId);
        List<ComplaintWorkflowDTO> dtos = new ArrayList<>();
        
        for (ComplaintWorkflow workflow : workflows) {
            String actorName = getActorName(workflow.getActorId(), workflow.getActorRole());
            dtos.add(ComplaintWorkflowDTO.fromEntity(workflow, actorName));
        }
        
        return dtos;
    }
    
    private String getActorName(Long actorId, String actorRole) {
        if (actorId == null || actorId == 0L) {
            return "System";
        }
        
        try {
            String url = authServiceUrl + "/users/" + actorId + "/public";
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response != null) {
                String firstName = (String) response.getOrDefault("firstName", "");
                String lastName = (String) response.getOrDefault("lastName", "");
                String fullName = (firstName + " " + lastName).trim();
                return fullName.isEmpty() ? actorRole : fullName;
            }
        } catch (Exception e) {
            log.error("Failed to fetch actor name for actorId: {}", actorId, e);
        }
        
        return actorRole;
    }
    
    @Transactional
    public void checkAndEscalateOverdueComplaints(List<Complaint> complaints) {
        LocalDateTime now = LocalDateTime.now();
        
        for (Complaint complaint : complaints) {
            long daysSinceCreation = java.time.temporal.ChronoUnit.DAYS
                    .between(complaint.getCreatedAt(), now);
            
            boolean shouldEscalate = switch (complaint.getPriority()) {
                case CRITICAL -> daysSinceCreation > 1 && complaint.getStatus() == ComplaintStatus.OPEN;
                case HIGH -> daysSinceCreation > 3 && complaint.getStatus() == ComplaintStatus.OPEN;
                case MEDIUM -> daysSinceCreation > 7 && complaint.getStatus() == ComplaintStatus.OPEN;
                case LOW -> daysSinceCreation > 14 && complaint.getStatus() == ComplaintStatus.OPEN;
            };
            
            if (shouldEscalate) {
                escalateComplaint(complaint);
            }
        }
    }
    
    private void escalateComplaint(Complaint complaint) {
        ComplaintWorkflow workflow = new ComplaintWorkflow();
        workflow.setComplaintId(complaint.getId());
        workflow.setFromStatus(complaint.getStatus());
        workflow.setToStatus(ComplaintStatus.IN_PROGRESS);
        workflow.setActorId(0L); // System
        workflow.setActorRole("SYSTEM");
        workflow.setIsEscalation(true);
        workflow.setEscalationReason("Automatic escalation due to overdue complaint");
        
        workflowRepository.save(workflow);
        
        // Notify ACADEMIC_OFFICE_AFFAIR
        ComplaintNotification notification = new ComplaintNotification();
        notification.setComplaintId(complaint.getId());
        notification.setRecipientId(0L); // Broadcast to all ACADEMIC_OFFICE_AFFAIR
        notification.setRecipientRole("ACADEMIC_OFFICE_AFFAIR");
        notification.setNotificationType("OVERDUE");
        notification.setMessage(String.format("Complaint '%s' is overdue and requires immediate attention", complaint.getSubject()));
        notification.setIsRead(false);
        
        ComplaintNotification saved = notificationRepository.save(notification);
        
        // Send real-time notification via SSE
        notificationSseService.sendNotificationToRole("ACADEMIC_OFFICE_AFFAIR", saved);
        log.info("Real-time overdue notification sent to ACADEMIC_OFFICE_AFFAIR");
        
        log.warn("Complaint {} escalated due to overdue status", complaint.getId());
    }
}
