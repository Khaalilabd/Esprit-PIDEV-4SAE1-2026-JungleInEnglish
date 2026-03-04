package com.englishflow.courses.service;

import com.englishflow.courses.dto.PackEnrollmentDTO;
import com.englishflow.courses.entity.Course;
import com.englishflow.courses.entity.CourseEnrollment;
import com.englishflow.courses.entity.Pack;
import com.englishflow.courses.entity.PackEnrollment;
import com.englishflow.courses.repository.CourseEnrollmentRepository;
import com.englishflow.courses.repository.CourseRepository;
import com.englishflow.courses.repository.PackEnrollmentRepository;
import com.englishflow.courses.repository.PackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PackEnrollmentService implements IPackEnrollmentService {
    
    private final PackEnrollmentRepository enrollmentRepository;
    private final PackRepository packRepository;
    private final IPackService packService;
    private final CourseEnrollmentRepository courseEnrollmentRepository;
    private final CourseRepository courseRepository;
    private final com.englishflow.courses.repository.LessonRepository lessonRepository;
    private final LessonProgressService lessonProgressService;
    private final CourseEnrollmentService courseEnrollmentService;
    private final com.englishflow.courses.client.MessagingServiceClient messagingServiceClient;
    private final com.englishflow.courses.client.AuthServiceClient authServiceClient;
    
    @Override
    @Transactional
    public PackEnrollmentDTO enrollStudent(Long studentId, Long packId) {
        // Check if already enrolled
        if (isStudentEnrolled(studentId, packId)) {
            throw new RuntimeException("Student is already enrolled in this pack");
        }
        
        // Get pack details
        Pack pack = packRepository.findById(packId)
            .orElseThrow(() -> new RuntimeException("Pack not found with id: " + packId));
        
        // Check if pack is full
        if (pack.isFull()) {
            throw new RuntimeException("Pack is full");
        }
        
        // Check if enrollment is open
        if (!pack.isEnrollmentOpen()) {
            throw new RuntimeException("Enrollment is not open for this pack");
        }
        
        // Récupérer les informations de l'étudiant
        String studentName = "Student " + studentId;
        try {
            com.englishflow.courses.dto.UserDTO student = authServiceClient.getUserById(studentId);
            if (student != null) {
                studentName = student.getFirstName() + " " + student.getLastName();
            }
        } catch (Exception e) {
            System.err.println("Failed to fetch student details: " + e.getMessage());
        }
        
        // Create pack enrollment
        PackEnrollment enrollment = new PackEnrollment();
        enrollment.setStudentId(studentId);
        enrollment.setStudentName(studentName);
        enrollment.setPackId(packId);
        enrollment.setPackName(pack.getName());
        enrollment.setPackCategory(pack.getCategory());
        enrollment.setPackLevel(pack.getLevel());
        enrollment.setTutorId(pack.getTutorId());
        enrollment.setTutorName(pack.getTutorName());
        enrollment.setTotalCourses(pack.getCourseIds() != null ? pack.getCourseIds().size() : 0);
        enrollment.setStatus("ACTIVE");
        enrollment.setIsActive(true);
        
        PackEnrollment saved = enrollmentRepository.save(enrollment);
        
        // Ajouter l'étudiant au groupe de discussion du pack
        if (pack.getConversationId() != null) {
            try {
                messagingServiceClient.addStudentToPackGroup(pack.getConversationId(), studentId);
                
                // Envoyer un message système de bienvenue
                String welcomeMessage = String.format(
                    "🎉 %s a rejoint le pack!", 
                    enrollment.getStudentName()
                );
                messagingServiceClient.sendSystemMessage(pack.getConversationId(), welcomeMessage);
            } catch (Exception e) {
                System.err.println("Failed to add student to messaging group: " + e.getMessage());
            }
        }
        
        // Auto-enroll student in all courses in the pack
        if (pack.getCourseIds() != null && !pack.getCourseIds().isEmpty()) {
            enrollStudentInPackCourses(studentId, pack.getCourseIds());
        }
        
        // Update pack enrollment count
        packService.incrementEnrollment(packId);
        
        return mapToDTO(saved, studentId);
    }
    
    /**
     * Automatically enroll student in all courses within the pack
     */
    @Transactional
    private void enrollStudentInPackCourses(Long studentId, List<Long> courseIds) {
        for (Long courseId : courseIds) {
            try {
                // Check if already enrolled in this course
                if (!courseEnrollmentRepository.existsByStudentIdAndCourseIdAndIsActive(studentId, courseId, true)) {
                    // FIX 2: Validate course exists and is PUBLISHED before enrolling
                    Course course = courseRepository.findById(courseId).orElse(null);
                    if (course == null) {
                        System.err.println("Course " + courseId + " not found, skipping enrollment");
                        continue;
                    }
                    
                    if (course.getStatus() != com.englishflow.courses.enums.CourseStatus.PUBLISHED) {
                        System.err.println("Course " + courseId + " is " + course.getStatus() + ", skipping enrollment");
                        continue;
                    }
                    
                    // Course is valid and published, proceed with enrollment
                    CourseEnrollment courseEnrollment = new CourseEnrollment();
                    courseEnrollment.setStudentId(studentId);
                    courseEnrollment.setCourse(course);
                    courseEnrollment.setIsActive(true);
                    
                    // Calculate total PUBLISHED lessons for this course
                    Long totalLessons = lessonRepository.countPublishedByCourseId(courseId);
                    courseEnrollment.setTotalLessons(totalLessons != null ? totalLessons.intValue() : 0);
                    
                    courseEnrollmentRepository.save(courseEnrollment);
                }
            } catch (Exception e) {
                System.err.println("Failed to enroll student " + studentId + " in course " + courseId + ": " + e.getMessage());
            }
        }
    }
    
    /**
     * Calculate pack progress using WEIGHTED lesson-based formula
     * Formula: (total completed lessons across all courses) / (total lessons across all courses) × 100
     */
    @Transactional(readOnly = true)
    public double calculatePackProgress(Long studentId, Long packId) {
        Pack pack = packRepository.findById(packId)
            .orElseThrow(() -> new RuntimeException("Pack not found"));
        
        if (pack.getCourseIds() == null || pack.getCourseIds().isEmpty()) {
            return 0.0;
        }
        
        int totalCompletedLessons = 0;
        int totalLessons = 0;
        
        // Get all course enrollments for this student in this pack
        List<CourseEnrollment> courseEnrollments = courseEnrollmentRepository
            .findByStudentIdAndIsActive(studentId, true).stream()
            .filter(ce -> pack.getCourseIds().contains(ce.getCourse().getId()))
            .collect(Collectors.toList());
        
        // Aggregate lesson counts across all courses
        for (CourseEnrollment enrollment : courseEnrollments) {
            totalLessons += enrollment.getTotalLessons();
            totalCompletedLessons += courseEnrollmentService.getCompletedLessonsCount(
                studentId, 
                enrollment.getCourse().getId()
            );
        }
        
        // Calculate weighted percentage
        if (totalLessons == 0) {
            return 0.0;
        }
        
        return (totalCompletedLessons / (double) totalLessons) * 100.0;
    }
    
    /**
     * Get count of completed courses in pack
     */
    @Transactional(readOnly = true)
    public int getCompletedCoursesCount(Long studentId, Long packId) {
        Pack pack = packRepository.findById(packId)
            .orElseThrow(() -> new RuntimeException("Pack not found"));
        
        if (pack.getCourseIds() == null || pack.getCourseIds().isEmpty()) {
            return 0;
        }
        
        int completedCount = 0;
        
        for (Long courseId : pack.getCourseIds()) {
            if (courseEnrollmentService.isCourseCompleted(studentId, courseId)) {
                completedCount++;
            }
        }
        
        return completedCount;
    }
    
    /**
     * Check if pack is completed and mark it
     * Pack is completed when ALL courses are completed
     */
    @Transactional
    public void checkAndMarkPackCompletion(Long studentId, Long packId) {
        PackEnrollment enrollment = enrollmentRepository.findByStudentIdAndPackId(studentId, packId)
            .orElse(null);
        
        if (enrollment == null || enrollment.getCompletedAt() != null) {
            return;
        }
        
        Pack pack = packRepository.findById(packId).orElse(null);
        if (pack == null || pack.getCourseIds() == null || pack.getCourseIds().isEmpty()) {
            return;
        }
        
        // Check if all courses are completed
        boolean allCoursesCompleted = true;
        for (Long courseId : pack.getCourseIds()) {
            if (!courseEnrollmentService.isCourseCompleted(studentId, courseId)) {
                allCoursesCompleted = false;
                break;
            }
        }
        
        if (allCoursesCompleted) {
            enrollment.setCompletedAt(LocalDateTime.now());
            enrollment.setStatus("COMPLETED");
            enrollment.setIsActive(false);
            enrollmentRepository.save(enrollment);
        }
    }
    
    @Override
    public PackEnrollmentDTO getById(Long id) {
        PackEnrollment enrollment = enrollmentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Enrollment not found with id: " + id));
        
        return mapToDTO(enrollment, enrollment.getStudentId());
    }
    
    @Override
    public List<PackEnrollmentDTO> getByStudentId(Long studentId) {
        return enrollmentRepository.findByStudentId(studentId).stream()
            .map(enrollment -> mapToDTO(enrollment, studentId))
            .collect(Collectors.toList());
    }
    
    @Override
    public List<PackEnrollmentDTO> getByPackId(Long packId) {
        return enrollmentRepository.findByPackId(packId).stream()
            .map(enrollment -> mapToDTO(enrollment, enrollment.getStudentId()))
            .collect(Collectors.toList());
    }
    
    @Override
    public List<PackEnrollmentDTO> getByTutorId(Long tutorId) {
        return enrollmentRepository.findByTutorId(tutorId).stream()
            .map(enrollment -> mapToDTO(enrollment, enrollment.getStudentId()))
            .collect(Collectors.toList());
    }
    
    @Override
    public List<PackEnrollmentDTO> getActiveEnrollmentsByStudent(Long studentId) {
        return enrollmentRepository.findByStudentIdAndIsActive(studentId, true).stream()
            .map(enrollment -> mapToDTO(enrollment, studentId))
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public PackEnrollmentDTO updateProgress(Long enrollmentId, Integer progressPercentage) {
        // This method is deprecated - progress is now calculated dynamically
        PackEnrollment enrollment = enrollmentRepository.findById(enrollmentId)
            .orElseThrow(() -> new RuntimeException("Enrollment not found with id: " + enrollmentId));
        
        // Check and mark completion if needed
        checkAndMarkPackCompletion(enrollment.getStudentId(), enrollment.getPackId());
        
        return mapToDTO(enrollment, enrollment.getStudentId());
    }
    
    @Override
    @Transactional
    public void completeEnrollment(Long enrollmentId) {
        PackEnrollment enrollment = enrollmentRepository.findById(enrollmentId)
            .orElseThrow(() -> new RuntimeException("Enrollment not found with id: " + enrollmentId));
        
        enrollment.setCompletedAt(LocalDateTime.now());
        enrollment.setIsActive(false);
        enrollment.setStatus("COMPLETED");
        
        enrollmentRepository.save(enrollment);
    }
    
    @Override
    @Transactional
    public void cancelEnrollment(Long enrollmentId) {
        PackEnrollment enrollment = enrollmentRepository.findById(enrollmentId)
            .orElseThrow(() -> new RuntimeException("Enrollment not found with id: " + enrollmentId));
        
        // Retirer l'étudiant du groupe de discussion
        Pack pack = packRepository.findById(enrollment.getPackId()).orElse(null);
        if (pack != null && pack.getConversationId() != null) {
            try {
                messagingServiceClient.removeStudentFromPackGroup(
                    pack.getConversationId(), 
                    enrollment.getStudentId()
                );
                
                // Envoyer un message système
                String leaveMessage = String.format(
                    "👋 %s a quitté le pack", 
                    enrollment.getStudentName()
                );
                messagingServiceClient.sendSystemMessage(pack.getConversationId(), leaveMessage);
            } catch (Exception e) {
                System.err.println("Failed to remove student from messaging group: " + e.getMessage());
            }
        }
        
        enrollment.setIsActive(false);
        enrollment.setStatus("CANCELLED");
        enrollmentRepository.save(enrollment);
        
        // Update pack enrollment count
        packService.decrementEnrollment(enrollment.getPackId());
    }
    
    @Override
    public boolean isStudentEnrolled(Long studentId, Long packId) {
        return enrollmentRepository.findByStudentIdAndPackId(studentId, packId).isPresent();
    }
    
    /**
     * Map entity to DTO with dynamically calculated progress
     */
    private PackEnrollmentDTO mapToDTO(PackEnrollment enrollment, Long studentId) {
        PackEnrollmentDTO dto = new PackEnrollmentDTO();
        dto.setId(enrollment.getId());
        dto.setStudentId(enrollment.getStudentId());
        dto.setStudentName(enrollment.getStudentName());
        dto.setPackId(enrollment.getPackId());
        dto.setPackName(enrollment.getPackName());
        dto.setPackCategory(enrollment.getPackCategory());
        dto.setPackLevel(enrollment.getPackLevel());
        dto.setTutorId(enrollment.getTutorId());
        dto.setTutorName(enrollment.getTutorName());
        dto.setTotalCourses(enrollment.getTotalCourses());
        dto.setEnrolledAt(enrollment.getEnrolledAt());
        dto.setCompletedAt(enrollment.getCompletedAt());
        dto.setStatus(enrollment.getStatus());
        dto.setIsActive(enrollment.getIsActive());
        
        // Calculate progress and completed courses dynamically
        double progress = calculatePackProgress(studentId, enrollment.getPackId());
        int completedCourses = getCompletedCoursesCount(studentId, enrollment.getPackId());
        
        dto.setProgressPercentage((int) Math.round(progress));
        dto.setCompletedCourses(completedCourses);
        
        return dto;
    }
}
