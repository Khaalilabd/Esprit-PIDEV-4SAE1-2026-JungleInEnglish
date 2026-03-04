package com.englishflow.exam.repository;

import com.englishflow.exam.entity.ExamPart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamPartRepository extends JpaRepository<ExamPart, String> {
    List<ExamPart> findByExamIdOrderByOrderIndexAsc(String examId);
}
