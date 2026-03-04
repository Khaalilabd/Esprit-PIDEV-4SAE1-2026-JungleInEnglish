package com.englishflow.exam.repository;

import com.englishflow.exam.entity.Exam;
import com.englishflow.exam.enums.ExamLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExamRepository extends JpaRepository<Exam, String> {
    List<Exam> findByIsPublishedTrue();
    List<Exam> findByIsPublishedTrueAndLevel(ExamLevel level);
    boolean existsByLevelAndIsPublishedTrue(ExamLevel level);
    long countByLevelAndIsPublishedTrue(ExamLevel level);
    List<Exam> findByIsPublished(Boolean isPublished);
    List<Exam> findByLevelAndIsPublished(ExamLevel level, Boolean isPublished);
    
    @Query("SELECT DISTINCT e FROM Exam e " +
           "LEFT JOIN FETCH e.parts p " +
           "WHERE e.id = :id")
    Optional<Exam> findByIdWithPartsAndQuestions(@Param("id") String id);
}
