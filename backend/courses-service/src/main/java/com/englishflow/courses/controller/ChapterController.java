package com.englishflow.courses.controller;

import com.englishflow.courses.dto.ChapterDTO;
import com.englishflow.courses.service.IChapterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/chapters")
@RequiredArgsConstructor
public class ChapterController {
    
    private final IChapterService chapterService;
    
    @PostMapping
    public ResponseEntity<ChapterDTO> createChapter(@RequestBody ChapterDTO chapterDTO) {
        ChapterDTO created = chapterService.createChapter(chapterDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ChapterDTO> getChapterById(@PathVariable Long id) {
        ChapterDTO chapter = chapterService.getChapterById(id);
        return ResponseEntity.ok(chapter);
    }
    
    @GetMapping
    public ResponseEntity<List<ChapterDTO>> getAllChapters() {
        List<ChapterDTO> chapters = chapterService.getAllChapters();
        return ResponseEntity.ok(chapters);
    }
    
    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<ChapterDTO>> getChaptersByCourse(@PathVariable Long courseId) {
        List<ChapterDTO> chapters = chapterService.getChaptersByCourse(courseId);
        return ResponseEntity.ok(chapters);
    }
    
    @GetMapping("/course/{courseId}/published")
    public ResponseEntity<List<ChapterDTO>> getPublishedChaptersByCourse(@PathVariable Long courseId) {
        List<ChapterDTO> chapters = chapterService.getPublishedChaptersByCourse(courseId);
        return ResponseEntity.ok(chapters);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ChapterDTO> updateChapter(@PathVariable Long id, @RequestBody ChapterDTO chapterDTO) {
        ChapterDTO updated = chapterService.updateChapter(id, chapterDTO);
        return ResponseEntity.ok(updated);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteChapter(@PathVariable Long id) {
        chapterService.deleteChapter(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/{id}/exists")
    public ResponseEntity<Boolean> chapterExists(@PathVariable Long id) {
        boolean exists = chapterService.existsById(id);
        return ResponseEntity.ok(exists);
    }
    
    @GetMapping("/{chapterId}/belongs-to-course/{courseId}")
    public ResponseEntity<Boolean> chapterBelongsToCourse(@PathVariable Long chapterId, @PathVariable Long courseId) {
        boolean belongs = chapterService.belongsToCourse(chapterId, courseId);
        return ResponseEntity.ok(belongs);
    }
    
    // FIX 3: Bulk publish/unpublish all chapters in a course
    @PutMapping("/course/{courseId}/publish-all")
    public ResponseEntity<List<ChapterDTO>> publishAllChaptersByCourse(@PathVariable Long courseId) {
        List<ChapterDTO> chapters = chapterService.publishAllChaptersByCourse(courseId);
        return ResponseEntity.ok(chapters);
    }
    
    @PutMapping("/course/{courseId}/unpublish-all")
    public ResponseEntity<List<ChapterDTO>> unpublishAllChaptersByCourse(@PathVariable Long courseId) {
        List<ChapterDTO> chapters = chapterService.unpublishAllChaptersByCourse(courseId);
        return ResponseEntity.ok(chapters);
    }
}
