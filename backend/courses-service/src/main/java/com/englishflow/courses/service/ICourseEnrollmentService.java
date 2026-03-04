package com.englishflow.courses.service;

import com.englishflow.courses.dto.CourseEnrollmentDTO;

import java.util.List;

public interface ICourseEnrollmentService {
    
    /**
     * Enroll a student in a course
     */
    CourseEnrollmentDTO enrollStudent(Long studentId, Long courseId);
    
    /**
     * Unenroll a student from a course
     */
    void unenrollStudent(Long studentId, Long courseId);
    
    /**
     * Get all enrollments for a student
     */
    List<CourseEnrollmentDTO> getStudentEnrollments(Long studentId);
    
    /**
     * Get all enrollments for a course
     */
    List<CourseEnrollmentDTO> getCourseEnrollments(Long courseId);
    
    /**
     * Check if student is enrolled in course
     */
    boolean isStudentEnrolled(Long studentId, Long courseId);
    
    /**
     * Update student progress
     */
    CourseEnrollmentDTO updateProgress(Long studentId, Long courseId, Double progress, Integer completedLessons);
    
    /**
     * Get enrollment details
     */
    CourseEnrollmentDTO getEnrollment(Long studentId, Long courseId);
    
    /**
     * Get enrollment count for a course
     */
    Long getCourseEnrollmentCount(Long courseId);
}