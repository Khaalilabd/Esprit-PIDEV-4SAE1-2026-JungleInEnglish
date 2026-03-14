package com.englishflow.courses.service;

import com.englishflow.courses.dto.CourseCategoryDTO;
import com.englishflow.courses.entity.CourseCategory;
import com.englishflow.courses.repository.CourseCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseCategoryService implements ICourseCategoryService {
    
    private final CourseCategoryRepository categoryRepository;
    
    @Override
    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public CourseCategoryDTO createCategory(CourseCategoryDTO categoryDTO) {
        if (categoryRepository.existsByName(categoryDTO.getName())) {
            throw new RuntimeException("Category with name '" + categoryDTO.getName() + "' already exists");
        }
        
        CourseCategory category = new CourseCategory();
        category.setName(categoryDTO.getName());
        category.setDescription(categoryDTO.getDescription());
        category.setIcon(categoryDTO.getIcon());
        category.setColor(categoryDTO.getColor());
        category.setActive(categoryDTO.getActive() != null ? categoryDTO.getActive() : true);
        category.setDisplayOrder(categoryDTO.getDisplayOrder() != null ? categoryDTO.getDisplayOrder() : 0);
        category.setCreatedBy(categoryDTO.getCreatedBy());
        
        CourseCategory saved = categoryRepository.save(category);
        return toDTO(saved);
    }
    
    @Override
    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public CourseCategoryDTO updateCategory(Long id, CourseCategoryDTO categoryDTO) {
        CourseCategory category = categoryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        
        // Check if name is being changed and if new name already exists
        if (!category.getName().equals(categoryDTO.getName()) && 
            categoryRepository.existsByName(categoryDTO.getName())) {
            throw new RuntimeException("Category with name '" + categoryDTO.getName() + "' already exists");
        }
        
        category.setName(categoryDTO.getName());
        category.setDescription(categoryDTO.getDescription());
        category.setIcon(categoryDTO.getIcon());
        category.setColor(categoryDTO.getColor());
        category.setActive(categoryDTO.getActive());
        category.setDisplayOrder(categoryDTO.getDisplayOrder());
        
        CourseCategory updated = categoryRepository.save(category);
        return toDTO(updated);
    }
    
    @Override
    @Cacheable(value = "categories", key = "#id")
    public CourseCategoryDTO getById(Long id) {
        return categoryRepository.findById(id)
            .map(this::toDTO)
            .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
    }
    
    @Override
    @Cacheable(value = "categories", key = "'all'")
    public List<CourseCategoryDTO> getAllCategories() {
        return categoryRepository.findAllByOrderByDisplayOrderAsc().stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }
    
    @Override
    @Cacheable(value = "categories", key = "'active'")
    public List<CourseCategoryDTO> getActiveCategories() {
        return categoryRepository.findByActiveOrderByDisplayOrderAsc(true).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public void deleteCategory(Long id) {
        categoryRepository.deleteById(id);
    }
    
    @Override
    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public void toggleActive(Long id) {
        CourseCategory category = categoryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        category.setActive(!category.getActive());
        categoryRepository.save(category);
    }
    
    @Override
    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public void updateDisplayOrder(Long id, Integer newOrder) {
        CourseCategory category = categoryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        category.setDisplayOrder(newOrder);
        categoryRepository.save(category);
    }
    
    private CourseCategoryDTO toDTO(CourseCategory category) {
        CourseCategoryDTO dto = new CourseCategoryDTO();
        dto.setId(category.getId());
        dto.setName(category.getName());
        dto.setDescription(category.getDescription());
        dto.setIcon(category.getIcon());
        dto.setColor(category.getColor());
        dto.setActive(category.getActive());
        dto.setDisplayOrder(category.getDisplayOrder());
        dto.setCreatedAt(category.getCreatedAt());
        dto.setUpdatedAt(category.getUpdatedAt());
        dto.setCreatedBy(category.getCreatedBy());
        return dto;
    }
}
