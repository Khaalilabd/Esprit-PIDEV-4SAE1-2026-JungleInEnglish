package com.englishflow.exam.repository;

import com.englishflow.exam.entity.ExamResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExamResultRepository extends JpaRepository<ExamResult, String> {
    List<ExamResult> findByUserId(Long userId);
    Optional<ExamResult> findByAttemptId(String attemptId);
    List<ExamResult> findByUserIdOrderByCreatedAtDesc(Long userId);
}
