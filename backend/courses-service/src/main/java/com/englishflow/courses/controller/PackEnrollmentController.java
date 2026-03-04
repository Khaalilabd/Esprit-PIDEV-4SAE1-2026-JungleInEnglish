package com.englishflow.courses.controller;

import com.englishflow.courses.dto.PackEnrollmentDTO;
import com.englishflow.courses.service.IPackEnrollmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/pack-enrollments")
@RequiredArgsConstructor
public class PackEnrollmentController {
    
    private final IPackEnrollmentService enrollmentService;
    
    @PostMapping
    public ResponseEntity<?> enrollStudent(
            @RequestParam Long studentId,
            @RequestParam Long packId) {
        try {
            PackEnrollmentDTO enrollment = enrollmentService.enrollStudent(studentId, packId);
            return ResponseEntity.status(HttpStatus.CREATED).body(enrollment);
        } catch (RuntimeException e) {
            // Return error message in response body
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<PackEnrollmentDTO> getById(@PathVariable Long id) {
        PackEnrollmentDTO enrollment = enrollmentService.getById(id);
        return ResponseEntity.ok(enrollment);
    }
    
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<PackEnrollmentDTO>> getByStudentId(@PathVariable Long studentId) {
        List<PackEnrollmentDTO> enrollments = enrollmentService.getByStudentId(studentId);
        return ResponseEntity.ok(enrollments);
    }
    
    @GetMapping("/student/{studentId}/active")
    public ResponseEntity<List<PackEnrollmentDTO>> getActiveEnrollmentsByStudent(@PathVariable Long studentId) {
        List<PackEnrollmentDTO> enrollments = enrollmentService.getActiveEnrollmentsByStudent(studentId);
        return ResponseEntity.ok(enrollments);
    }
    
    @GetMapping("/pack/{packId}")
    public ResponseEntity<List<PackEnrollmentDTO>> getByPackId(@PathVariable Long packId) {
        List<PackEnrollmentDTO> enrollments = enrollmentService.getByPackId(packId);
        return ResponseEntity.ok(enrollments);
    }
    
    @GetMapping("/tutor/{tutorId}")
    public ResponseEntity<List<PackEnrollmentDTO>> getByTutorId(@PathVariable Long tutorId) {
        List<PackEnrollmentDTO> enrollments = enrollmentService.getByTutorId(tutorId);
        return ResponseEntity.ok(enrollments);
    }
    
    
    @PutMapping("/{id}/complete")
    public ResponseEntity<Void> completeEnrollment(@PathVariable Long id) {
        enrollmentService.completeEnrollment(id);
        return ResponseEntity.ok().build();
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancelEnrollment(@PathVariable Long id) {
        enrollmentService.cancelEnrollment(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/check")
    public ResponseEntity<Boolean> isStudentEnrolled(
            @RequestParam Long studentId,
            @RequestParam Long packId) {
        boolean enrolled = enrollmentService.isStudentEnrolled(studentId, packId);
        return ResponseEntity.ok(enrolled);
    }
    
    @PostMapping("/recalculate-progress")
    public ResponseEntity<PackEnrollmentDTO> recalculateProgress(
            @RequestParam Long studentId,
            @RequestParam Long packId) {
        try {
            // Progress is now calculated dynamically - just fetch the enrollment
            PackEnrollmentDTO enrollment = enrollmentService.getById(
                enrollmentService.getByStudentId(studentId).stream()
                    .filter(e -> e.getPackId().equals(packId))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Enrollment not found"))
                    .getId()
            );
            return ResponseEntity.ok(enrollment);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }
}
