package com.englishflow.exam.repository;

import com.englishflow.exam.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, String> {
    List<Question> findByPartIdOrderByOrderIndexAsc(String partId);
    long countByPartId(String partId);
}
