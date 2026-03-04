package com.englishflow.courses.service;

import com.englishflow.courses.dto.LessonDTO;
import com.englishflow.courses.entity.Chapter;
import com.englishflow.courses.entity.Lesson;
import com.englishflow.courses.enums.LessonType;
import com.englishflow.courses.repository.ChapterRepository;
import com.englishflow.courses.repository.LessonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LessonService implements ILessonService {
    
    private final LessonRepository lessonRepository;
    private final ChapterRepository chapterRepository;
    
    @Override
    @Transactional(readOnly = true)
    public List<LessonDTO> getAllLessons() {
        return lessonRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public LessonDTO getLessonById(Long id) {
        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lesson not found with id: " + id));
        return mapToDTO(lesson);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<LessonDTO> getLessonsByChapter(Long chapterId) {
        return lessonRepository.findByChapterIdOrderByOrderIndexAsc(chapterId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<LessonDTO> getPublishedLessonsByChapter(Long chapterId) {
        return lessonRepository.findByChapterIdAndIsPublished(chapterId, true).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<LessonDTO> getLessonsByCourse(Long courseId) {
        return lessonRepository.findByCourseId(courseId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<LessonDTO> getLessonsByType(LessonType type) {
        return lessonRepository.findByLessonType(type).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<LessonDTO> getPreviewLessonsByCourse(Long courseId) {
        return lessonRepository.findByCourseIdAndIsPreview(courseId, true).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public LessonDTO createLesson(LessonDTO lessonDTO) {
        Chapter chapter = chapterRepository.findById(lessonDTO.getChapterId())
                .orElseThrow(() -> new RuntimeException("Chapter not found with id: " + lessonDTO.getChapterId()));
        
        Lesson lesson = mapToEntity(lessonDTO);
        lesson.setChapter(chapter);
        Lesson savedLesson = lessonRepository.save(lesson);
        return mapToDTO(savedLesson);
    }
    
    @Override
    @Transactional
    public LessonDTO updateLesson(Long id, LessonDTO lessonDTO) {
        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lesson not found with id: " + id));
        
        lesson.setTitle(lessonDTO.getTitle());
        lesson.setDescription(lessonDTO.getDescription());
        lesson.setContent(lessonDTO.getContent());
        lesson.setContentUrl(lessonDTO.getContentUrl());
        lesson.setLessonType(lessonDTO.getLessonType());
        lesson.setOrderIndex(lessonDTO.getOrderIndex());
        lesson.setDuration(lessonDTO.getDuration());
        lesson.setIsPreview(lessonDTO.getIsPreview());
        lesson.setIsPublished(lessonDTO.getIsPublished());
        
        Lesson updatedLesson = lessonRepository.save(lesson);
        return mapToDTO(updatedLesson);
    }
    
    @Override
    @Transactional
    public void deleteLesson(Long id) {
        if (!lessonRepository.existsById(id)) {
            throw new RuntimeException("Lesson not found with id: " + id);
        }
        lessonRepository.deleteById(id);
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean existsById(Long id) {
        return lessonRepository.existsById(id);
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean belongsToChapter(Long lessonId, Long chapterId) {
        return lessonRepository.findById(lessonId)
                .map(lesson -> lesson.getChapter().getId().equals(chapterId))
                .orElse(false);
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean belongsToCourse(Long lessonId, Long courseId) {
        return lessonRepository.findById(lessonId)
                .map(lesson -> lesson.getChapter().getCourse().getId().equals(courseId))
                .orElse(false);
    }
    
    // Additional methods for backward compatibility
    @Transactional(readOnly = true)
    public List<LessonDTO> getPreviewLessons() {
        return lessonRepository.findByIsPreview(true).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }
    
    private LessonDTO mapToDTO(Lesson lesson) {
        LessonDTO dto = new LessonDTO();
        dto.setId(lesson.getId());
        dto.setTitle(lesson.getTitle());
        dto.setDescription(lesson.getDescription());
        dto.setContent(lesson.getContent());
        dto.setContentUrl(lesson.getContentUrl());
        dto.setLessonType(lesson.getLessonType());
        dto.setOrderIndex(lesson.getOrderIndex());
        dto.setDuration(lesson.getDuration());
        dto.setIsPreview(lesson.getIsPreview());
        dto.setIsPublished(lesson.getIsPublished());
        dto.setChapterId(lesson.getChapter().getId());
        dto.setCreatedAt(lesson.getCreatedAt());
        dto.setUpdatedAt(lesson.getUpdatedAt());
        return dto;
    }
    
    private Lesson mapToEntity(LessonDTO dto) {
        Lesson lesson = new Lesson();
        lesson.setTitle(dto.getTitle());
        lesson.setDescription(dto.getDescription());
        lesson.setContent(dto.getContent());
        lesson.setContentUrl(dto.getContentUrl());
        lesson.setLessonType(dto.getLessonType());
        lesson.setOrderIndex(dto.getOrderIndex() != null ? dto.getOrderIndex() : 0);
        lesson.setDuration(dto.getDuration() != null ? dto.getDuration() : 0);
        lesson.setIsPreview(dto.getIsPreview() != null ? dto.getIsPreview() : false);
        lesson.setIsPublished(dto.getIsPublished() != null ? dto.getIsPublished() : false);
        return lesson;
    }
    
    // FIX 3: Bulk publish/unpublish all lessons in a course
    @Transactional
    public List<LessonDTO> publishAllLessonsByCourse(Long courseId) {
        List<Lesson> lessons = lessonRepository.findByCourseId(courseId);
        lessons.forEach(lesson -> lesson.setIsPublished(true));
        List<Lesson> updated = lessonRepository.saveAll(lessons);
        return updated.stream().map(this::mapToDTO).collect(Collectors.toList());
    }
    
    @Transactional
    public List<LessonDTO> unpublishAllLessonsByCourse(Long courseId) {
        List<Lesson> lessons = lessonRepository.findByCourseId(courseId);
        lessons.forEach(lesson -> lesson.setIsPublished(false));
        List<Lesson> updated = lessonRepository.saveAll(lessons);
        return updated.stream().map(this::mapToDTO).collect(Collectors.toList());
    }
}
