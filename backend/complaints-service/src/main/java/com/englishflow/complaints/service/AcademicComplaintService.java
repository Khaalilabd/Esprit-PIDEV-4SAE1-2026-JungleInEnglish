package com.englishflow.complaints.service;

import com.englishflow.complaints.dto.ComplaintWithUserDTO;
import com.englishflow.complaints.entity.Complaint;
import com.englishflow.complaints.enums.ComplaintCategory;
import com.englishflow.complaints.repository.ComplaintRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AcademicComplaintService {
    
    private final ComplaintRepository complaintRepository;
    private final RestTemplate restTemplate;
    private final ComplaintWorkflowService workflowService;
    private final ComplaintPriorityService priorityService;
    
    @Value("${auth.service.url}")
    private String authServiceUrl;
    
    /**
     * Get all complaints with user information for ACADEMIC_OFFICE_AFFAIR
     */
    public List<ComplaintWithUserDTO> getAllComplaintsWithUserInfo() {
        log.info("Fetching all complaints with user info for ACADEMIC_OFFICE_AFFAIR");
        
        List<Complaint> complaints = complaintRepository.findAllByOrderByCreatedAtDesc();
        return buildComplaintDTOs(complaints);
    }
    
    /**
     * Get complaints for ACADEMIC_OFFICE_AFFAIR (TECHNICAL, ADMINISTRATIVE, BEHAVIORAL, SCHEDULE, TUTOR_BEHAVIOR, CLUB_SUSPENSION, OTHER)
     */
    public List<ComplaintWithUserDTO> getComplaintsForAcademicOffice() {
        log.info("Fetching complaints for ACADEMIC_OFFICE_AFFAIR");
        
        List<Complaint> complaints = complaintRepository.findAllByOrderByCreatedAtDesc();
        
        // Filter only TECHNICAL, ADMINISTRATIVE, BEHAVIORAL, SCHEDULE, TUTOR_BEHAVIOR, CLUB_SUSPENSION, OTHER
        List<Complaint> filteredComplaints = complaints.stream()
                .filter(c -> c.getCategory() == ComplaintCategory.TECHNICAL ||
                           c.getCategory() == ComplaintCategory.ADMINISTRATIVE ||
                           c.getCategory() == ComplaintCategory.BEHAVIORAL ||
                           c.getCategory() == ComplaintCategory.SCHEDULE ||
                           c.getCategory() == ComplaintCategory.TUTOR_BEHAVIOR ||
                           c.getCategory() == ComplaintCategory.CLUB_SUSPENSION ||
                           c.getCategory() == ComplaintCategory.OTHER)
                .toList();
        
        return buildComplaintDTOs(filteredComplaints);
    }
    
    /**
     * Get complaints for TUTOR (PEDAGOGICAL only)
     */
    public List<ComplaintWithUserDTO> getComplaintsForTutor() {
        log.info("Fetching complaints for TUTOR");
        
        List<Complaint> complaints = complaintRepository.findAllByOrderByCreatedAtDesc();
        
        // Filter only PEDAGOGICAL
        List<Complaint> filteredComplaints = complaints.stream()
                .filter(c -> c.getCategory() == ComplaintCategory.PEDAGOGICAL)
                .toList();
        
        return buildComplaintDTOs(filteredComplaints);
    }
    
    /**
     * Helper method to build ComplaintWithUserDTO list
     */
    private List<ComplaintWithUserDTO> buildComplaintDTOs(List<Complaint> complaints) {
        List<ComplaintWithUserDTO> result = new ArrayList<>();
        
        for (Complaint complaint : complaints) {
            // Recalculate risk score for each complaint
            priorityService.calculateRiskScore(complaint);
            complaintRepository.save(complaint);
            
            try {
                // Fetch user info from auth service
                Map<String, Object> userInfo = getUserInfo(complaint.getUserId());
                String firstName = (String) userInfo.getOrDefault("firstName", "");
                String lastName = (String) userInfo.getOrDefault("lastName", "");
                String username = (firstName + " " + lastName).trim();
                if (username.isEmpty()) {
                    username = "User#" + complaint.getUserId();
                }
                String email = (String) userInfo.getOrDefault("email", "N/A");
                
                ComplaintWithUserDTO dto = ComplaintWithUserDTO.fromComplaint(complaint, username, email);
                
                // Add escalation history
                var history = workflowService.getComplaintHistory(complaint.getId());
                List<String> escalations = history.stream()
                        .filter(w -> w.getIsEscalation())
                        .map(w -> w.getEscalationReason())
                        .toList();
                dto.setEscalationHistory(escalations);
                
                result.add(dto);
            } catch (Exception e) {
                log.error("Error fetching user info for userId: {}", complaint.getUserId(), e);
                // Add complaint with default user info
                ComplaintWithUserDTO dto = ComplaintWithUserDTO.fromComplaint(
                        complaint, "User#" + complaint.getUserId(), "N/A");
                result.add(dto);
            }
        }
        
        return result;
    }
    
    /**
     * Get high priority and overdue complaints for dashboard
     */
    public List<ComplaintWithUserDTO> getCriticalComplaints() {
        log.info("Fetching critical complaints for ACADEMIC_OFFICE_AFFAIR");
        
        List<Complaint> complaints = complaintRepository.findAllByOrderByCreatedAtDesc();
        List<ComplaintWithUserDTO> result = new ArrayList<>();
        
        for (Complaint complaint : complaints) {
            ComplaintWithUserDTO dto = ComplaintWithUserDTO.fromComplaint(
                    complaint, "User#" + complaint.getUserId(), "N/A");
            
            // Only include high priority or overdue complaints
            if (complaint.getPriority().name().equals("URGENT") || 
                complaint.getPriority().name().equals("HIGH") || 
                dto.getIsOverdue()) {
                
                try {
                    Map<String, Object> userInfo = getUserInfo(complaint.getUserId());
                    String firstName = (String) userInfo.getOrDefault("firstName", "");
                    String lastName = (String) userInfo.getOrDefault("lastName", "");
                    String username = (firstName + " " + lastName).trim();
                    if (username.isEmpty()) {
                        username = "User#" + complaint.getUserId();
                    }
                    dto.setUsername(username);
                    dto.setUserEmail((String) userInfo.getOrDefault("email", "N/A"));
                } catch (Exception e) {
                    log.error("Error fetching user info", e);
                }
                
                result.add(dto);
            }
        }
        
        return result;
    }
    
    private Map<String, Object> getUserInfo(Long userId) {
        try {
            String url = authServiceUrl + "/users/" + userId + "/public";
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            log.info("Successfully fetched user info for userId: {}", userId);
            return response != null ? response : Map.of("firstName", "User#" + userId, "email", "N/A");
        } catch (Exception e) {
            log.error("Failed to fetch user info from auth service for userId: {}", userId, e);
            return Map.of("firstName", "User#" + userId, "email", "N/A");
        }
    }
}
