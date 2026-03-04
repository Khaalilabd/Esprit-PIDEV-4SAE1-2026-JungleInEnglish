package com.englishflow.courses.controller;

import com.englishflow.courses.dto.*;
import com.englishflow.courses.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/progress")
@RequiredArgsConstructor
public class ProgressSummaryController {
    
    private final ICourseEnrollmentService enrollmentService;
    private final LessonProgressService lessonProgressService;
    private final ICourseService courseService;
    private final ChapterService chapterService;
    
    @GetMapping("/summary")
    public ResponseEntity<StudentProgressSummaryDTO> getProgressSummary(
            @RequestParam Long studentId,
            @RequestParam Long courseId) {
        
        // Get enrollment details
        CourseEnrollmentDTO enrollment = enrollmentService.getEnrollment(studentId, courseId);
        
        // Get course details
        CourseDTO course = courseService.getCourseById(courseId);
        
        // Get lesson progress
        List<LessonProgressDTO> lessonProgress = List.of(); // Empty list for now
        
        // Calculate stats
        StudentProgressSummaryDTO.ProgressStatsDTO stats = new StudentProgressSummaryDTO.ProgressStatsDTO();
        stats.setTotalLessons(enrollment.getTotalLessons());
        stats.setCompletedLessons(enrollment.getCompletedLessons());
        stats.setTotalChapters(0); // Can be calculated from course if needed
        stats.setCompletedChapters(0); // Can be calculated if needed
        stats.setOverallProgress(enrollment.getProgress());
        stats.setTotalTimeSpentMinutes(lessonProgress.stream()
                .mapToInt(lp -> lp.getTimeSpentMinutes() != null ? lp.getTimeSpentMinutes() : 0)
                .sum());
        
        // Build summary
        StudentProgressSummaryDTO summary = new StudentProgressSummaryDTO();
        summary.setStudentId(studentId);
        summary.setCourseId(courseId);
        summary.setCourseTitle(course.getTitle());
        summary.setEnrollment(enrollment);
        summary.setChapterProgress(List.of()); // No longer tracking chapter progress
        summary.setLessonProgress(lessonProgress);
        summary.setStats(stats);
        
        return ResponseEntity.ok(summary);
    }
    
    @PostMapping("/demo")
    public ResponseEntity<String> createDemoProgress(
            @RequestParam Long studentId,
            @RequestParam Long courseId) {
        
        try {
            // Enroll student if not already enrolled
            if (!enrollmentService.isStudentEnrolled(studentId, courseId)) {
                enrollmentService.enrollStudent(studentId, courseId);
            }
            
            // Demo progress creation - simplified
            // Just enroll the student, progress will be tracked as they complete lessons
            
            return ResponseEntity.ok("Demo progress created successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error creating demo progress: " + e.getMessage());
        }
    }
}