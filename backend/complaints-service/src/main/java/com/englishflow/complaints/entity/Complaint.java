package com.englishflow.complaints.entity;

import com.englishflow.complaints.enums.*;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "complaints")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Complaint {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotNull(message = "User ID is required")
    @Column(nullable = false)
    private Long userId;
    
    @NotNull(message = "Target role is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TargetRole targetRole;
    
    @NotNull(message = "Category is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ComplaintCategory category;
    
    @NotBlank(message = "Subject is required")
    @Size(min = 5, max = 200, message = "Subject must be between 5 and 200 characters")
    @Column(nullable = false, length = 200)
    private String subject;
    
    @NotBlank(message = "Description is required")
    @Size(min = 20, max = 5000, message = "Description must be between 20 and 5000 characters")
    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ComplaintStatus status = ComplaintStatus.OPEN;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ComplaintPriority priority = ComplaintPriority.MEDIUM;
    
    @Column
    private Integer riskScore = 0; // Calculated risk score
    
    @Column
    private Boolean requiresIntervention = false; // Needs proactive intervention
    
    @Column
    private Boolean studentConfirmed = false; // Student confirmed resolution
    
    @Enumerated(EnumType.STRING)
    @Column
    private ResolutionFeedback studentFeedback; // Feedback after resolution
    
    @Column(columnDefinition = "TEXT")
    private String systemInsight; // Detected causes
    
    @Enumerated(EnumType.STRING)
    @Column
    private AcademicRiskLevel riskLevel = AcademicRiskLevel.NORMAL;
    
    // Détails spécifiques selon la catégorie
    @Column(length = 100)
    private String courseType; // Pour PEDAGOGICAL
    
    @Column(length = 100)
    private String difficulty; // Pour PEDAGOGICAL
    
    @Column(length = 100)
    private String issueType; // Type spécifique du problème
    
    @Column
    private Integer sessionCount; // Nombre de séances concernées
    
    @Column
    private Integer clubId; // Pour CLUB_SUSPENSION - ID du club concerné
    
    @Column(columnDefinition = "TEXT")
    private String response;
    
    @Column
    private Long responderId; // ID du tuteur/manager qui répond
    
    @Column(length = 50)
    private String responderRole; // TUTOR/MANAGER
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
