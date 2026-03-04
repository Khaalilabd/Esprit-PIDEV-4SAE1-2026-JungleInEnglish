package com.englishflow.exam.repository;

import com.englishflow.exam.entity.CorrectAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CorrectAnswerRepository extends JpaRepository<CorrectAnswer, String> {
    Optional<CorrectAnswer> findByQuestionId(String questionId);
}
