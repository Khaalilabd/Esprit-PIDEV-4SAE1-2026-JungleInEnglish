package com.englishflow.courses.controller;

import com.englishflow.courses.dto.CourseDTO;
import com.englishflow.courses.enums.CourseStatus;
import com.englishflow.courses.service.ICourseService;
import com.englishflow.courses.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/courses")
@RequiredArgsConstructor
public class CourseController {
    
    private final ICourseService courseService;
    private final FileStorageService fileStorageService;
    
    @PostMapping
    public ResponseEntity<CourseDTO> createCourse(@RequestBody CourseDTO courseDTO) {
        CourseDTO created = courseService.createCourse(courseDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<CourseDTO> getCourseById(@PathVariable Long id) {
        CourseDTO course = courseService.getCourseById(id);
        return ResponseEntity.ok(course);
    }
    
    @GetMapping
    public ResponseEntity<Page<CourseDTO>> getAllCourses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(sortDirection), sortBy));
        Page<CourseDTO> courses = courseService.getAllCoursesPaginated(pageable);
        return ResponseEntity.ok(courses);
    }
    
    @GetMapping("/all")
    public ResponseEntity<List<CourseDTO>> getAllCoursesNoPagination() {
        List<CourseDTO> courses = courseService.getAllCourses();
        return ResponseEntity.ok(courses);
    }
    
    @GetMapping("/published")
    public ResponseEntity<List<CourseDTO>> getPublishedCourses() {
        List<CourseDTO> courses = courseService.getPublishedCourses();
        return ResponseEntity.ok(courses);
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<List<CourseDTO>> getCoursesByStatus(@PathVariable CourseStatus status) {
        List<CourseDTO> courses = courseService.getCoursesByStatus(status);
        return ResponseEntity.ok(courses);
    }
    
    @GetMapping("/level/{level}")
    public ResponseEntity<List<CourseDTO>> getCoursesByLevel(@PathVariable String level) {
        List<CourseDTO> courses = courseService.getCoursesByLevel(level);
        return ResponseEntity.ok(courses);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<CourseDTO> updateCourse(@PathVariable Long id, @RequestBody CourseDTO courseDTO) {
        CourseDTO updated = courseService.updateCourse(id, courseDTO);
        return ResponseEntity.ok(updated);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCourse(@PathVariable Long id) {
        courseService.deleteCourse(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/tutor/{tutorId}")
    public ResponseEntity<List<CourseDTO>> getCoursesByTutor(@PathVariable Long tutorId) {
        List<CourseDTO> courses = courseService.getCoursesByTutor(tutorId);
        return ResponseEntity.ok(courses);
    }
    
    @GetMapping("/{id}/exists")
    public ResponseEntity<Boolean> courseExists(@PathVariable Long id) {
        boolean exists = courseService.existsById(id);
        return ResponseEntity.ok(exists);
    }
    
    @PostMapping("/{id}/upload-thumbnail")
    public ResponseEntity<Map<String, String>> uploadThumbnail(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        
        try {
            // Validate file
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Please select a file"));
            }
            
            // Check if it's an image
            if (!fileStorageService.isValidImageFile(file)) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Only image files are allowed"));
            }
            
            // Check file size (max 5MB)
            long maxSize = 5 * 1024 * 1024;
            if (!fileStorageService.isValidFileSize(file, maxSize)) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "File size must be less than 5MB"));
            }
            
            // Get course
            CourseDTO course = courseService.getCourseById(id);
            
            // Delete old thumbnail if exists
            if (course.getThumbnailUrl() != null) {
                fileStorageService.deleteFile(course.getThumbnailUrl());
            }
            
            // Store new thumbnail
            String thumbnailUrl = fileStorageService.storeThumbnail(file);
            
            // Update course
            course.setThumbnailUrl(thumbnailUrl);
            courseService.updateCourse(id, course);
            
            Map<String, String> response = new HashMap<>();
            response.put("thumbnailUrl", thumbnailUrl);
            response.put("message", "Thumbnail uploaded successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to upload thumbnail: " + e.getMessage()));
        }
    }
    
    @PostMapping("/{id}/upload-material")
    public ResponseEntity<Map<String, String>> uploadCourseMaterial(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        
        try {
            // Validate file
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Please select a file"));
            }
            
            // Check if it's a valid course material
            if (!fileStorageService.isValidCourseMaterial(file)) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid file type. Allowed: PDF, DOC, PPT, MP4, MP3, ZIP"));
            }
            
            // Check file size (max 50MB)
            long maxSize = 50 * 1024 * 1024;
            if (!fileStorageService.isValidFileSize(file, maxSize)) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "File size must be less than 50MB"));
            }
            
            // Get course
            CourseDTO course = courseService.getCourseById(id);
            
            // Store material
            String materialUrl = fileStorageService.storeCourseMaterial(file);
            
            // Update course fileUrl (you might want to store multiple files in a separate table)
            course.setFileUrl(materialUrl);
            courseService.updateCourse(id, course);
            
            Map<String, String> response = new HashMap<>();
            response.put("fileUrl", materialUrl);
            response.put("message", "Course material uploaded successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to upload material: " + e.getMessage()));
        }
    }
    
    @DeleteMapping("/{id}/thumbnail")
    public ResponseEntity<Map<String, String>> deleteThumbnail(@PathVariable Long id) {
        try {
            CourseDTO course = courseService.getCourseById(id);
            
            if (course.getThumbnailUrl() != null) {
                fileStorageService.deleteFile(course.getThumbnailUrl());
                course.setThumbnailUrl(null);
                courseService.updateCourse(id, course);
            }
            
            return ResponseEntity.ok(Map.of("message", "Thumbnail deleted successfully"));
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to delete thumbnail: " + e.getMessage()));
        }
    }
}
