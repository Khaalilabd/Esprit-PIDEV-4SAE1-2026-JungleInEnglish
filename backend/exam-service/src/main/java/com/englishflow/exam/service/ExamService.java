package com.englishflow.exam.service;

import com.englishflow.exam.dto.request.CreateExamDTO;
import com.englishflow.exam.dto.request.UpdateExamDTO;
import com.englishflow.exam.dto.response.ExamDetailDTO;
import com.englishflow.exam.dto.response.ExamSummaryDTO;
import com.englishflow.exam.dto.response.PartDTO;
import com.englishflow.exam.entity.Exam;
import com.englishflow.exam.entity.ExamPart;
import com.englishflow.exam.entity.Question;
import com.englishflow.exam.entity.QuestionOption;
import com.englishflow.exam.enums.ExamLevel;
import com.englishflow.exam.repository.ExamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExamService implements IExamService {
    
    private final ExamRepository examRepository;
    
    @Override
    @Transactional
    public ExamSummaryDTO createExam(CreateExamDTO dto) {
        Exam exam = Exam.builder()
                .title(dto.getTitle())
                .level(dto.getLevel())
                .description(dto.getDescription())
                .totalDuration(dto.getTotalDuration())
                .passingScore(dto.getPassingScore())
                .isPublished(false)
                .build();
        
        Exam savedExam = examRepository.save(exam);
        return mapToSummaryDTO(savedExam);
    }
    
    @Override
    @Transactional(readOnly = true)
    public ExamDetailDTO getExamById(String id) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Exam not found with id: " + id));
        
        // Force initialization of lazy collections
        if (exam.getParts() != null) {
            exam.getParts().size();
            exam.getParts().forEach(part -> {
                if (part.getQuestions() != null) {
                    part.getQuestions().size();
                    part.getQuestions().forEach(question -> {
                        if (question.getOptions() != null) {
                            question.getOptions().size();
                        }
                    });
                }
            });
        }
        
        return mapToDetailDTO(exam);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ExamSummaryDTO> getAllExams() {
        return examRepository.findAll().stream()
                .map(this::mapToSummaryDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ExamSummaryDTO> getPublishedExams(ExamLevel level) {
        List<Exam> exams;
        if (level != null) {
            exams = examRepository.findByLevelAndIsPublished(level, true);
        } else {
            exams = examRepository.findByIsPublished(true);
        }
        return exams.stream()
                .map(this::mapToSummaryDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public ExamSummaryDTO updateExam(String id, UpdateExamDTO dto) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Exam not found with id: " + id));
        
        if (dto.getTitle() != null) {
            exam.setTitle(dto.getTitle());
        }
        if (dto.getLevel() != null) {
            exam.setLevel(dto.getLevel());
        }
        if (dto.getDescription() != null) {
            exam.setDescription(dto.getDescription());
        }
        if (dto.getTotalDuration() != null) {
            exam.setTotalDuration(dto.getTotalDuration());
        }
        if (dto.getPassingScore() != null) {
            exam.setPassingScore(dto.getPassingScore());
        }
        
        Exam updatedExam = examRepository.save(exam);
        return mapToSummaryDTO(updatedExam);
    }
    
    @Override
    @Transactional
    public void deleteExam(String id) {
        if (!examRepository.existsById(id)) {
            throw new RuntimeException("Exam not found with id: " + id);
        }
        examRepository.deleteById(id);
    }
    
    @Override
    @Transactional
    public void publishExam(String id) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Exam not found with id: " + id));
        exam.setIsPublished(true);
        examRepository.save(exam);
    }
    
    @Override
    @Transactional
    public void unpublishExam(String id) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Exam not found with id: " + id));
        exam.setIsPublished(false);
        examRepository.save(exam);
    }
    
    private ExamSummaryDTO mapToSummaryDTO(Exam exam) {
        return ExamSummaryDTO.builder()
                .id(exam.getId())
                .title(exam.getTitle())
                .level(exam.getLevel())
                .description(exam.getDescription())
                .totalDuration(exam.getTotalDuration())
                .passingScore(exam.getPassingScore())
                .isPublished(exam.getIsPublished())
                .partCount(exam.getParts() != null ? exam.getParts().size() : 0)
                .questionCount(exam.getParts() != null ? 
                    exam.getParts().stream()
                        .mapToInt(part -> part.getQuestions() != null ? part.getQuestions().size() : 0)
                        .sum() : 0)
                .createdAt(exam.getCreatedAt())
                .updatedAt(exam.getUpdatedAt())
                .build();
    }
    
    private ExamDetailDTO mapToDetailDTO(Exam exam) {
        return ExamDetailDTO.builder()
                .id(exam.getId())
                .title(exam.getTitle())
                .level(exam.getLevel())
                .description(exam.getDescription())
                .totalDuration(exam.getTotalDuration())
                .passingScore(exam.getPassingScore())
                .isPublished(exam.getIsPublished())
                .parts(exam.getParts() != null ? 
                    exam.getParts().stream()
                        .map(this::mapPartToDTO)
                        .collect(Collectors.toList()) : List.of())
                .createdAt(exam.getCreatedAt())
                .updatedAt(exam.getUpdatedAt())
                .build();
    }
    
    private PartDTO mapPartToDTO(ExamPart part) {
        List<com.englishflow.exam.dto.response.QuestionDTO> questionDTOs = List.of();
        
        if (part.getQuestions() != null && !part.getQuestions().isEmpty()) {
            questionDTOs = part.getQuestions().stream()
                    .map(this::mapQuestionToDTO)
                    .collect(Collectors.toList());
        }
        
        return PartDTO.builder()
                .id(part.getId())
                .title(part.getTitle())
                .partType(part.getPartType())
                .instructions(part.getInstructions())
                .orderIndex(part.getOrderIndex())
                .timeLimit(part.getTimeLimit())
                .audioUrl(part.getAudioUrl())
                .readingText(part.getReadingText())
                .questions(questionDTOs)
                .build();
    }
    
    private com.englishflow.exam.dto.response.QuestionDTO mapQuestionToDTO(com.englishflow.exam.entity.Question question) {
        return com.englishflow.exam.dto.response.QuestionDTO.builder()
                .id(question.getId())
                .questionType(question.getQuestionType())
                .prompt(question.getPrompt())
                .mediaUrl(question.getMediaUrl())
                .orderIndex(question.getOrderIndex())
                .points(question.getPoints())
                .explanation(question.getExplanation())
                .metadata(question.getMetadata())
                .options(question.getOptions() != null ?
                    question.getOptions().stream()
                        .map(this::mapOptionToDTO)
                        .collect(Collectors.toList()) : List.of())
                .build();
    }
    
    private com.englishflow.exam.dto.response.OptionDTO mapOptionToDTO(com.englishflow.exam.entity.QuestionOption option) {
        return com.englishflow.exam.dto.response.OptionDTO.builder()
                .id(option.getId())
                .label(option.getLabel())
                .orderIndex(option.getOrderIndex())
                .isCorrect(option.getIsCorrect())
                .build();
    }
}
