package com.englishflow.exam.repository;

import com.englishflow.exam.entity.StudentExamAttempt;
import com.englishflow.exam.enums.AttemptStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudentExamAttemptRepository extends JpaRepository<StudentExamAttempt, String> {
    List<StudentExamAttempt> findByUserId(Long userId);
    List<StudentExamAttempt> findByUserIdAndExamId(Long userId, String examId);
    Optional<StudentExamAttempt> findByUserIdAndExamIdAndStatus(Long userId, String examId, AttemptStatus status);
    List<StudentExamAttempt> findByStatus(AttemptStatus status);
    List<StudentExamAttempt> findByStatusAndStartedAtBefore(AttemptStatus status, LocalDateTime cutoff);
}
