package com.englishflow.exam.repository;

import com.englishflow.exam.entity.QuestionOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionOptionRepository extends JpaRepository<QuestionOption, String> {
    List<QuestionOption> findByQuestionIdOrderByOrderIndexAsc(String questionId);
    void deleteByQuestionId(String questionId);
}
