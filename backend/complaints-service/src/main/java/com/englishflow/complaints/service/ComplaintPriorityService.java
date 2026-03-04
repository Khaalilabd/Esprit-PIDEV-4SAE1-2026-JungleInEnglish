package com.englishflow.complaints.service;

import com.englishflow.complaints.entity.Complaint;
import com.englishflow.complaints.enums.AcademicRiskLevel;
import com.englishflow.complaints.enums.ComplaintCategory;
import com.englishflow.complaints.enums.ComplaintPriority;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
@Slf4j
public class ComplaintPriorityService {
    
    /**
     * Calculate priority based on complaint details
     */
    public ComplaintPriority calculatePriority(Complaint complaint) {
        int score = 0;
        
        // Category weight
        score += getCategoryWeight(complaint.getCategory());
        
        // Risk score weight
        if (complaint.getRiskScore() != null) {
            score += complaint.getRiskScore() / 10; // Normalize to 0-10
        }
        
        // Academic risk level weight
        if (complaint.getRiskLevel() != null) {
            score += getRiskLevelWeight(complaint.getRiskLevel());
        }
        
        // Time-based urgency
        if (complaint.getCreatedAt() != null) {
            long daysSinceCreation = ChronoUnit.DAYS.between(complaint.getCreatedAt(), LocalDateTime.now());
            if (daysSinceCreation > 7) {
                score += 3;
            } else if (daysSinceCreation > 3) {
                score += 2;
            }
        }
        
        // Requires intervention flag
        if (Boolean.TRUE.equals(complaint.getRequiresIntervention())) {
            score += 5;
        }
        
        log.debug("Calculated priority score: {} for complaint: {}", score, complaint.getId());
        
        // Determine priority based on score
        if (score >= 15) {
            return ComplaintPriority.CRITICAL;
        } else if (score >= 10) {
            return ComplaintPriority.HIGH;
        } else if (score >= 5) {
            return ComplaintPriority.MEDIUM;
        } else {
            return ComplaintPriority.LOW;
        }
    }
    
    /**
     * Calculate priority and determine target role for complaint
     */
    public void calculatePriorityAndTarget(Complaint complaint) {
        // Determine target role based on category if not set
        if (complaint.getTargetRole() == null) {
            complaint.setTargetRole(determineTargetRole(complaint.getCategory()));
        }
        
        // Calculate risk score
        int riskScore = calculateRiskScore(complaint);
        complaint.setRiskScore(riskScore);
        
        // Calculate academic risk level
        AcademicRiskLevel riskLevel = calculateAcademicRiskLevel(complaint);
        complaint.setRiskLevel(riskLevel);
        
        // Determine if requires intervention
        boolean requiresIntervention = requiresIntervention(complaint);
        complaint.setRequiresIntervention(requiresIntervention);
        
        // Calculate priority
        ComplaintPriority priority = calculatePriority(complaint);
        complaint.setPriority(priority);
        
        log.info("Complaint priority calculated - Risk: {}, Level: {}, Priority: {}, Intervention: {}, Target: {}", 
                 riskScore, riskLevel, priority, requiresIntervention, complaint.getTargetRole());
    }
    
    /**
     * Determine target role based on complaint category
     */
    private com.englishflow.complaints.enums.TargetRole determineTargetRole(ComplaintCategory category) {
        switch (category) {
            case PEDAGOGICAL:
                return com.englishflow.complaints.enums.TargetRole.TUTOR;
            case BEHAVIORAL:
                return com.englishflow.complaints.enums.TargetRole.ACADEMIC_OFFICE_AFFAIR;
            case TUTOR_BEHAVIOR:
                return com.englishflow.complaints.enums.TargetRole.ACADEMIC_OFFICE_AFFAIR;
            case SCHEDULE:
                return com.englishflow.complaints.enums.TargetRole.ACADEMIC_OFFICE_AFFAIR;
            case CLUB_SUSPENSION:
                return com.englishflow.complaints.enums.TargetRole.ACADEMIC_OFFICE_AFFAIR;
            case TECHNICAL:
                return com.englishflow.complaints.enums.TargetRole.SUPPORT;
            case ADMINISTRATIVE:
                return com.englishflow.complaints.enums.TargetRole.ACADEMIC_OFFICE_AFFAIR;
            case OTHER:
                return com.englishflow.complaints.enums.TargetRole.SUPPORT;
            default:
                return com.englishflow.complaints.enums.TargetRole.SUPPORT;
        }
    }
    
    /**
     * Calculate risk score (0-100)
     */
    public int calculateRiskScore(Complaint complaint) {
        int score = 0;
        
        // Category-based risk
        switch (complaint.getCategory()) {
            case PEDAGOGICAL:
                score += 30;
                break;
            case TECHNICAL:
                score += 20;
                break;
            case ADMINISTRATIVE:
                score += 25;
                break;
            case BEHAVIORAL:
                score += 40;
                break;
            case TUTOR_BEHAVIOR:
                score += 35;
                break;
            case SCHEDULE:
                score += 30;
                break;
            case CLUB_SUSPENSION:
                score += 35;
                break;
            case OTHER:
                score += 15;
                break;
        }
        
        // Time-based risk
        if (complaint.getCreatedAt() != null) {
            long daysSinceCreation = ChronoUnit.DAYS.between(complaint.getCreatedAt(), LocalDateTime.now());
            score += Math.min((int) daysSinceCreation * 5, 30); // Max 30 points for time
        }
        
        // Session count impact (for pedagogical issues)
        if (complaint.getSessionCount() != null && complaint.getSessionCount() > 3) {
            score += 20;
        }
        
        return Math.min(score, 100); // Cap at 100
    }
    
    /**
     * Determine if complaint requires immediate intervention
     */
    public boolean requiresIntervention(Complaint complaint) {
        // Critical categories
        if (complaint.getCategory() == ComplaintCategory.BEHAVIORAL || 
            complaint.getCategory() == ComplaintCategory.TUTOR_BEHAVIOR) {
            return true;
        }
        
        // High risk score
        if (complaint.getRiskScore() != null && complaint.getRiskScore() > 70) {
            return true;
        }
        
        // Old unresolved complaints
        if (complaint.getCreatedAt() != null) {
            long daysSinceCreation = ChronoUnit.DAYS.between(complaint.getCreatedAt(), LocalDateTime.now());
            if (daysSinceCreation > 7) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Calculate academic risk level
     */
    public AcademicRiskLevel calculateAcademicRiskLevel(Complaint complaint) {
        int riskScore = complaint.getRiskScore() != null ? complaint.getRiskScore() : 0;
        
        if (riskScore >= 80) {
            return AcademicRiskLevel.CRITICAL;
        } else if (riskScore >= 60) {
            return AcademicRiskLevel.HIGH;
        } else if (riskScore >= 40) {
            return AcademicRiskLevel.MEDIUM;
        } else if (riskScore >= 20) {
            return AcademicRiskLevel.LOW;
        } else {
            return AcademicRiskLevel.NORMAL;
        }
    }
    
    /**
     * Get category weight for priority calculation
     */
    private int getCategoryWeight(ComplaintCategory category) {
        switch (category) {
            case BEHAVIORAL:
                return 8;
            case TUTOR_BEHAVIOR:
                return 7;
            case PEDAGOGICAL:
                return 6;
            case SCHEDULE:
                return 6;
            case CLUB_SUSPENSION:
                return 6;
            case ADMINISTRATIVE:
                return 5;
            case TECHNICAL:
                return 4;
            case OTHER:
                return 2;
            default:
                return 3;
        }
    }
    
    /**
     * Get risk level weight for priority calculation
     */
    private int getRiskLevelWeight(AcademicRiskLevel riskLevel) {
        switch (riskLevel) {
            case CRITICAL:
                return 10;
            case HIGH:
                return 7;
            case MEDIUM:
                return 5;
            case LOW:
                return 3;
            case NORMAL:
                return 1;
            default:
                return 0;
        }
    }
}
