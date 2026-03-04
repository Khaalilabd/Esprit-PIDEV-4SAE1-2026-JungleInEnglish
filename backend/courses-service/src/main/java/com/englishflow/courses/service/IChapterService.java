package com.englishflow.courses.service;

import com.englishflow.courses.dto.ChapterDTO;

import java.util.List;

public interface IChapterService {
    
    /**
     * Get all chapters
     */
    List<ChapterDTO> getAllChapters();
    
    /**
     * Get chapter by ID
     */
    ChapterDTO getChapterById(Long id);
    
    /**
     * Get chapters by course ID
     */
    List<ChapterDTO> getChaptersByCourse(Long courseId);
    
    /**
     * Get published chapters by course ID
     */
    List<ChapterDTO> getPublishedChaptersByCourse(Long courseId);
    
    /**
     * Create a new chapter
     */
    ChapterDTO createChapter(ChapterDTO chapterDTO);
    
    /**
     * Update an existing chapter
     */
    ChapterDTO updateChapter(Long id, ChapterDTO chapterDTO);
    
    /**
     * Delete a chapter
     */
    void deleteChapter(Long id);
    
    /**
     * Check if chapter exists
     */
    boolean existsById(Long id);
    
    /**
     * Check if chapter belongs to course
     */
    boolean belongsToCourse(Long chapterId, Long courseId);
    
    // FIX 3: Bulk publish/unpublish methods
    List<ChapterDTO> publishAllChaptersByCourse(Long courseId);
    List<ChapterDTO> unpublishAllChaptersByCourse(Long courseId);
}
