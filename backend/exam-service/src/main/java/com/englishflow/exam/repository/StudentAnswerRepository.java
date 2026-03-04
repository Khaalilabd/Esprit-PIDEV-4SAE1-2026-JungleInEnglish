package com.englishflow.exam.repository;

import com.englishflow.exam.entity.StudentAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentAnswerRepository extends JpaRepository<StudentAnswer, String> {
    List<StudentAnswer> findByAttemptId(String attemptId);
    Optional<StudentAnswer> findByAttemptIdAndQuestionId(String attemptId, String questionId);
    List<StudentAnswer> findByAttemptIdAndIsCorrectIsNull(String attemptId);
    long countByAttemptIdAndIsCorrectIsNull(String attemptId);
    List<StudentAnswer> findByIsCorrectIsNull();
    void deleteByAttemptId(String attemptId);
}
