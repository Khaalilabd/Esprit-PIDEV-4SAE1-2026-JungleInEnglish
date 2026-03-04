package com.englishflow.courses.service;

import com.englishflow.courses.dto.CourseEnrollmentDTO;
import com.englishflow.courses.entity.Course;
import com.englishflow.courses.entity.CourseEnrollment;
import com.englishflow.courses.repository.CourseEnrollmentRepository;
import com.englishflow.courses.repository.CourseRepository;
import com.englishflow.courses.repository.LessonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseEnrollmentService implements ICourseEnrollmentService {
    
    private final CourseEnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final LessonRepository lessonRepository;
    private final LessonProgressService lessonProgressService;
    private final UserValidationService userValidationService;
    
    @Override
    @Transactional
    public CourseEnrollmentDTO enrollStudent(Long studentId, Long courseId) {
        // Validate student exists and has STUDENT role
        userValidationService.validateStudentExists(studentId);
        
        // Check if course exists
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found with id: " + courseId));
        
        // Check if already enrolled
        if (enrollmentRepository.existsByStudentIdAndCourseIdAndIsActive(studentId, courseId, true)) {
            throw new RuntimeException("Student is already enrolled in this course");
        }
        
        // Check course capacity
        Long currentEnrollments = enrollmentRepository.countActiveByCourseId(courseId);
        if (course.getMaxStudents() != null && currentEnrollments >= course.getMaxStudents()) {
            throw new RuntimeException("Course is full. Maximum capacity reached.");
        }
        
        // Create enrollment
        CourseEnrollment enrollment = new CourseEnrollment();
        enrollment.setStudentId(studentId);
        enrollment.setCourse(course);
        enrollment.setIsActive(true);
        
        // Calculate total PUBLISHED lessons for this course
        Long totalLessons = lessonRepository.countPublishedByCourseId(courseId);
        enrollment.setTotalLessons(totalLessons.intValue());
        
        CourseEnrollment savedEnrollment = enrollmentRepository.save(enrollment);
        return mapToDTO(savedEnrollment, studentId);
    }
    
    @Override
    @Transactional
    public void unenrollStudent(Long studentId, Long courseId) {
        CourseEnrollment enrollment = enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));
        
        enrollment.setIsActive(false);
        enrollmentRepository.save(enrollment);
        
        // FIX 1: Clean up all lesson progress records when student unenrolls
        lessonProgressService.deleteProgressByStudentAndCourse(studentId, courseId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<CourseEnrollmentDTO> getStudentEnrollments(Long studentId) {
        return enrollmentRepository.findByStudentIdAndIsActive(studentId, true).stream()
                .map(enrollment -> mapToDTO(enrollment, studentId))
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<CourseEnrollmentDTO> getCourseEnrollments(Long courseId) {
        return enrollmentRepository.findActiveByCourseIdOrderByEnrolledAt(courseId).stream()
                .map(enrollment -> mapToDTO(enrollment, enrollment.getStudentId()))
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean isStudentEnrolled(Long studentId, Long courseId) {
        return enrollmentRepository.existsByStudentIdAndCourseIdAndIsActive(studentId, courseId, true);
    }
    
    @Override
    @Transactional
    public CourseEnrollmentDTO updateProgress(Long studentId, Long courseId, Double progress, Integer completedLessons) {
        // This method is deprecated - progress is now calculated dynamically
        // Just update last accessed time
        CourseEnrollment enrollment = enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));
        
        enrollment.setLastAccessedAt(LocalDateTime.now());
        
        // Check if course should be marked as completed
        checkAndMarkCourseCompletion(studentId, courseId, enrollment);
        
        CourseEnrollment updatedEnrollment = enrollmentRepository.save(enrollment);
        return mapToDTO(updatedEnrollment, studentId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public CourseEnrollmentDTO getEnrollment(Long studentId, Long courseId) {
        CourseEnrollment enrollment = enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));
        return mapToDTO(enrollment, studentId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Long getCourseEnrollmentCount(Long courseId) {
        return enrollmentRepository.countActiveByCourseId(courseId);
    }
    
    /**
     * Calculate course progress dynamically from LessonProgress
     * Formula: (completedLessons / totalLessons) × 100
     */
    @Transactional(readOnly = true)
    public double calculateCourseProgress(Long studentId, Long courseId) {
        CourseEnrollment enrollment = enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId)
                .orElse(null);
        
        if (enrollment == null || enrollment.getTotalLessons() == 0) {
            return 0.0;
        }
        
        // Count completed lessons from LessonProgress (source of truth)
        Long completedLessons = lessonProgressService.countCompletedLessonsInCourse(studentId, courseId);
        
        // Calculate percentage
        return (completedLessons.doubleValue() / enrollment.getTotalLessons()) * 100.0;
    }
    
    /**
     * Get completed lessons count for a course
     */
    @Transactional(readOnly = true)
    public int getCompletedLessonsCount(Long studentId, Long courseId) {
        Long count = lessonProgressService.countCompletedLessonsInCourse(studentId, courseId);
        return count.intValue();
    }
    
    /**
     * Check if course is completed and mark it
     * Course is completed when completedLessons == totalLessons
     */
    @Transactional
    public void checkAndMarkCourseCompletion(Long studentId, Long courseId, CourseEnrollment enrollment) {
        if (enrollment == null) {
            enrollment = enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId)
                    .orElse(null);
        }
        
        if (enrollment != null && enrollment.getCompletedAt() == null) {
            int completedLessons = getCompletedLessonsCount(studentId, courseId);
            
            // Use equality check, not threshold
            if (completedLessons >= enrollment.getTotalLessons() && enrollment.getTotalLessons() > 0) {
                enrollment.setCompletedAt(LocalDateTime.now());
                enrollmentRepository.save(enrollment);
            }
        }
    }
    
    /**
     * Check if course is completed
     */
    @Transactional(readOnly = true)
    public boolean isCourseCompleted(Long studentId, Long courseId) {
        CourseEnrollment enrollment = enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId)
                .orElse(null);
        
        if (enrollment == null || enrollment.getTotalLessons() == 0) {
            return false;
        }
        
        int completedLessons = getCompletedLessonsCount(studentId, courseId);
        return completedLessons >= enrollment.getTotalLessons();
    }
    
    /**
     * Map entity to DTO with dynamically calculated progress
     */
    private CourseEnrollmentDTO mapToDTO(CourseEnrollment enrollment, Long studentId) {
        CourseEnrollmentDTO dto = new CourseEnrollmentDTO();
        dto.setId(enrollment.getId());
        dto.setStudentId(enrollment.getStudentId());
        dto.setCourseId(enrollment.getCourse().getId());
        dto.setCourseTitle(enrollment.getCourse().getTitle());
        dto.setEnrolledAt(enrollment.getEnrolledAt());
        dto.setCompletedAt(enrollment.getCompletedAt());
        dto.setIsActive(enrollment.getIsActive());
        dto.setTotalLessons(enrollment.getTotalLessons());
        dto.setLastAccessedAt(enrollment.getLastAccessedAt());
        
        // Calculate progress dynamically
        int completedLessons = getCompletedLessonsCount(studentId, enrollment.getCourse().getId());
        double progress = enrollment.getTotalLessons() > 0 
            ? (completedLessons / (double) enrollment.getTotalLessons()) * 100.0 
            : 0.0;
        
        dto.setCompletedLessons(completedLessons);
        dto.setProgress(progress);
        
        return dto;
    }
}
