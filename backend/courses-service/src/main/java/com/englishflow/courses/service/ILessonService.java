package com.englishflow.courses.service;

import com.englishflow.courses.dto.LessonDTO;
import com.englishflow.courses.enums.LessonType;

import java.util.List;

public interface ILessonService {
    
    /**
     * Get all lessons
     */
    List<LessonDTO> getAllLessons();
    
    /**
     * Get lesson by ID
     */
    LessonDTO getLessonById(Long id);
    
    /**
     * Get lessons by chapter ID
     */
    List<LessonDTO> getLessonsByChapter(Long chapterId);
    
    /**
     * Get published lessons by chapter ID
     */
    List<LessonDTO> getPublishedLessonsByChapter(Long chapterId);
    
    /**
     * Get lessons by course ID
     */
    List<LessonDTO> getLessonsByCourse(Long courseId);
    
    /**
     * Get lessons by type
     */
    List<LessonDTO> getLessonsByType(LessonType type);
    
    /**
     * Get preview lessons by course ID
     */
    List<LessonDTO> getPreviewLessonsByCourse(Long courseId);
    
    /**
     * Create a new lesson
     */
    LessonDTO createLesson(LessonDTO lessonDTO);
    
    /**
     * Update an existing lesson
     */
    LessonDTO updateLesson(Long id, LessonDTO lessonDTO);
    
    /**
     * Delete a lesson
     */
    void deleteLesson(Long id);
    
    /**
     * Check if lesson exists
     */
    boolean existsById(Long id);
    
    /**
     * Check if lesson belongs to chapter
     */
    boolean belongsToChapter(Long lessonId, Long chapterId);
    
    /**
     * Check if lesson belongs to course
     */
    boolean belongsToCourse(Long lessonId, Long courseId);
    
    // FIX 3: Bulk publish/unpublish methods
    List<LessonDTO> publishAllLessonsByCourse(Long courseId);
    List<LessonDTO> unpublishAllLessonsByCourse(Long courseId);
}
