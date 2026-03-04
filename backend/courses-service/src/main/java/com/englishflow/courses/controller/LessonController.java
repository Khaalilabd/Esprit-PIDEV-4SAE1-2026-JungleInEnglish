package com.englishflow.courses.controller;

import com.englishflow.courses.dto.LessonDTO;
import com.englishflow.courses.enums.LessonType;
import com.englishflow.courses.service.ILessonService;
import com.englishflow.courses.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/lessons")
@RequiredArgsConstructor
public class LessonController {

    private final ILessonService lessonService;
    private final FileStorageService fileStorageService;

    @PostMapping
    public ResponseEntity<LessonDTO> createLesson(@RequestBody LessonDTO lessonDTO) {
        try {
            // Validate required fields
            if (lessonDTO.getTitle() == null || lessonDTO.getTitle().trim().isEmpty()) {
                throw new IllegalArgumentException("Lesson title is required");
            }
            if (lessonDTO.getChapterId() == null) {
                throw new IllegalArgumentException("Chapter ID is required");
            }
            if (lessonDTO.getLessonType() == null) {
                throw new IllegalArgumentException("Lesson type is required");
            }
            
            LessonDTO created = lessonService.createLesson(lessonDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Validation error: " + e.getMessage());
        } catch (Exception e) {
            throw new RuntimeException("Error creating lesson: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<LessonDTO> getLessonById(@PathVariable Long id) {
        LessonDTO lesson = lessonService.getLessonById(id);
        return ResponseEntity.ok(lesson);
    }

    @GetMapping
    public ResponseEntity<List<LessonDTO>> getAllLessons() {
        List<LessonDTO> lessons = lessonService.getAllLessons();
        return ResponseEntity.ok(lessons);
    }

    @GetMapping("/chapter/{chapterId}")
    public ResponseEntity<List<LessonDTO>> getLessonsByChapter(@PathVariable Long chapterId) {
        List<LessonDTO> lessons = lessonService.getLessonsByChapter(chapterId);
        return ResponseEntity.ok(lessons);
    }

    @GetMapping("/chapter/{chapterId}/published")
    public ResponseEntity<List<LessonDTO>> getPublishedLessonsByChapter(@PathVariable Long chapterId) {
        List<LessonDTO> lessons = lessonService.getPublishedLessonsByChapter(chapterId);
        return ResponseEntity.ok(lessons);
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<LessonDTO>> getLessonsByCourse(@PathVariable Long courseId) {
        List<LessonDTO> lessons = lessonService.getLessonsByCourse(courseId);
        return ResponseEntity.ok(lessons);
    }

    @GetMapping("/type/{lessonType}")
    public ResponseEntity<List<LessonDTO>> getLessonsByType(@PathVariable LessonType lessonType) {
        List<LessonDTO> lessons = lessonService.getLessonsByType(lessonType);
        return ResponseEntity.ok(lessons);
    }

    @GetMapping("/course/{courseId}/preview")
    public ResponseEntity<List<LessonDTO>> getPreviewLessonsByCourse(@PathVariable Long courseId) {
        List<LessonDTO> lessons = lessonService.getPreviewLessonsByCourse(courseId);
        return ResponseEntity.ok(lessons);
    }

    @PutMapping("/{id}")
    public ResponseEntity<LessonDTO> updateLesson(@PathVariable Long id, @RequestBody LessonDTO lessonDTO) {
        LessonDTO updated = lessonService.updateLesson(id, lessonDTO);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLesson(@PathVariable Long id) {
        lessonService.deleteLesson(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/exists")
    public ResponseEntity<Boolean> lessonExists(@PathVariable Long id) {
        boolean exists = lessonService.existsById(id);
        return ResponseEntity.ok(exists);
    }

    @GetMapping("/{lessonId}/belongs-to-chapter/{chapterId}")
    public ResponseEntity<Boolean> lessonBelongsToChapter(@PathVariable Long lessonId, @PathVariable Long chapterId) {
        boolean belongs = lessonService.belongsToChapter(lessonId, chapterId);
        return ResponseEntity.ok(belongs);
    }

    @GetMapping("/{lessonId}/belongs-to-course/{courseId}")
    public ResponseEntity<Boolean> lessonBelongsToCourse(@PathVariable Long lessonId, @PathVariable Long courseId) {
        boolean belongs = lessonService.belongsToCourse(lessonId, courseId);
        return ResponseEntity.ok(belongs);
    }

    /**
     * Upload video file for a lesson
     * Max size: 500MB
     * Allowed types: MP4, AVI, MOV, MKV
     */
    @PostMapping("/{id}/upload-video")
    public ResponseEntity<Map<String, String>> uploadVideo(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {

        // Validate file
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Please select a file to upload"));
        }

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("video/")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only video files are allowed"));
        }

        // Validate file size (500MB)
        long maxSize = 500 * 1024 * 1024L;
        if (!fileStorageService.isValidFileSize(file, maxSize)) {
            return ResponseEntity.badRequest().body(Map.of("error", "File size must not exceed 500MB"));
        }

        // Store file
        String fileUrl = fileStorageService.storeFile(file, "lessons/videos");

        // Update lesson with video URL
        LessonDTO lesson = lessonService.getLessonById(id);
        lesson.setContentUrl(fileUrl);
        lessonService.updateLesson(id, lesson);

        return ResponseEntity.ok(Map.of("url", fileUrl, "message", "Video uploaded successfully"));
    }

    /**
     * Upload document file for a lesson
     * Max size: 50MB
     * Allowed types: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX
     */
    @PostMapping("/{id}/upload-document")
    public ResponseEntity<Map<String, String>> uploadDocument(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {

        // Validate file
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Please select a file to upload"));
        }

        // Validate file type
        if (!fileStorageService.isValidCourseMaterial(file)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid file type. Allowed: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX"));
        }

        // Validate file size (50MB)
        long maxSize = 50 * 1024 * 1024L;
        if (!fileStorageService.isValidFileSize(file, maxSize)) {
            return ResponseEntity.badRequest().body(Map.of("error", "File size must not exceed 50MB"));
        }

        // Store file
        String fileUrl = fileStorageService.storeFile(file, "lessons/documents");

        // Update lesson with document URL
        LessonDTO lesson = lessonService.getLessonById(id);
        lesson.setContentUrl(fileUrl);
        lessonService.updateLesson(id, lesson);

        return ResponseEntity.ok(Map.of("url", fileUrl, "message", "Document uploaded successfully"));
    }

    /**
     * Delete lesson content file
     */
    @DeleteMapping("/{id}/content-file")
    public ResponseEntity<Map<String, String>> deleteContentFile(@PathVariable Long id) {
        LessonDTO lesson = lessonService.getLessonById(id);

        if (lesson.getContentUrl() != null && !lesson.getContentUrl().isEmpty()) {
            fileStorageService.deleteFile(lesson.getContentUrl());
            lesson.setContentUrl(null);
            lessonService.updateLesson(id, lesson);
        }

        return ResponseEntity.ok(Map.of("message", "Content file deleted successfully"));
    }
    
    // FIX 3: Bulk publish/unpublish all lessons in a course
    @PutMapping("/course/{courseId}/publish-all")
    public ResponseEntity<List<LessonDTO>> publishAllLessonsByCourse(@PathVariable Long courseId) {
        List<LessonDTO> lessons = lessonService.publishAllLessonsByCourse(courseId);
        return ResponseEntity.ok(lessons);
    }
    
    @PutMapping("/course/{courseId}/unpublish-all")
    public ResponseEntity<List<LessonDTO>> unpublishAllLessonsByCourse(@PathVariable Long courseId) {
        List<LessonDTO> lessons = lessonService.unpublishAllLessonsByCourse(courseId);
        return ResponseEntity.ok(lessons);
    }
}
