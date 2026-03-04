package com.englishflow.courses.repository;

import com.englishflow.courses.entity.LessonProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LessonProgressRepository extends JpaRepository<LessonProgress, Long> {
    
    Optional<LessonProgress> findByStudentIdAndLessonId(Long studentId, Long lessonId);
    
    List<LessonProgress> findByStudentIdAndCourseId(Long studentId, Long courseId);
    
    List<LessonProgress> findByStudentId(Long studentId);
    
    @Query("SELECT COUNT(lp) FROM LessonProgress lp WHERE lp.studentId = :studentId AND lp.courseId = :courseId AND lp.isCompleted = true")
    Long countCompletedLessonsByStudentAndCourse(@Param("studentId") Long studentId, @Param("courseId") Long courseId);
    
    boolean existsByStudentIdAndLessonId(Long studentId, Long lessonId);
    
    // FIX 1: Delete all lesson progress for a student in a course (for unenroll cleanup)
    void deleteByStudentIdAndCourseId(Long studentId, Long courseId);
}
