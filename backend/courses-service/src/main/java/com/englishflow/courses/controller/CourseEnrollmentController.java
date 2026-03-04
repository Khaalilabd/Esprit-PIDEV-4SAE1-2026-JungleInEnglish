package com.englishflow.courses.controller;

import com.englishflow.courses.dto.CourseEnrollmentDTO;
import com.englishflow.courses.service.ICourseEnrollmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/enrollments")
@RequiredArgsConstructor
public class CourseEnrollmentController {
    
    private final ICourseEnrollmentService enrollmentService;
    
    @PostMapping("/enroll")
    public ResponseEntity<CourseEnrollmentDTO> enrollStudent(
            @RequestParam Long studentId, 
            @RequestParam Long courseId) {
        CourseEnrollmentDTO enrollment = enrollmentService.enrollStudent(studentId, courseId);
        return ResponseEntity.status(HttpStatus.CREATED).body(enrollment);
    }
    
    @DeleteMapping("/unenroll")
    public ResponseEntity<Void> unenrollStudent(
            @RequestParam Long studentId, 
            @RequestParam Long courseId) {
        enrollmentService.unenrollStudent(studentId, courseId);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<CourseEnrollmentDTO>> getStudentEnrollments(@PathVariable Long studentId) {
        List<CourseEnrollmentDTO> enrollments = enrollmentService.getStudentEnrollments(studentId);
        return ResponseEntity.ok(enrollments);
    }
    
    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<CourseEnrollmentDTO>> getCourseEnrollments(@PathVariable Long courseId) {
        List<CourseEnrollmentDTO> enrollments = enrollmentService.getCourseEnrollments(courseId);
        return ResponseEntity.ok(enrollments);
    }
    
    @GetMapping("/check")
    public ResponseEntity<Boolean> isStudentEnrolled(
            @RequestParam Long studentId, 
            @RequestParam Long courseId) {
        boolean enrolled = enrollmentService.isStudentEnrolled(studentId, courseId);
        return ResponseEntity.ok(enrolled);
    }
    
    
    @GetMapping("/details")
    public ResponseEntity<CourseEnrollmentDTO> getEnrollment(
            @RequestParam Long studentId, 
            @RequestParam Long courseId) {
        CourseEnrollmentDTO enrollment = enrollmentService.getEnrollment(studentId, courseId);
        return ResponseEntity.ok(enrollment);
    }
    
    @GetMapping("/course/{courseId}/count")
    public ResponseEntity<Long> getCourseEnrollmentCount(@PathVariable Long courseId) {
        Long count = enrollmentService.getCourseEnrollmentCount(courseId);
        return ResponseEntity.ok(count);
    }
    
    @PutMapping("/calculate-progress")
    public ResponseEntity<CourseEnrollmentDTO> calculateAndUpdateProgress(
            @RequestParam Long studentId,
            @RequestParam Long courseId) {
        // Progress is now calculated dynamically - just fetch the enrollment
        CourseEnrollmentDTO enrollment = enrollmentService.getEnrollment(studentId, courseId);
        return ResponseEntity.ok(enrollment);
    }
}