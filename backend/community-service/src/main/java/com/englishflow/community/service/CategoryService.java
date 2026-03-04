package com.englishflow.community.service;

import com.englishflow.community.dto.CategoryDTO;
import com.englishflow.community.dto.CreateCategoryRequest;
import com.englishflow.community.dto.CreateSubCategoryRequest;
import com.englishflow.community.dto.SubCategoryDTO;
import com.englishflow.community.entity.Category;
import com.englishflow.community.entity.SubCategory;
import com.englishflow.community.exception.ResourceNotFoundException;
import com.englishflow.community.repository.CategoryRepository;
import com.englishflow.community.repository.SubCategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CategoryService {
    
    private final CategoryRepository categoryRepository;
    private final SubCategoryRepository subCategoryRepository;
    
    @Transactional(readOnly = true)
    // @Cacheable(value = "categories", key = "'all'") // Décommenter si Redis est activé
    public List<CategoryDTO> getAllCategories() {
        log.info("Fetching all categories from database");
        return categoryRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    // @Cacheable(value = "categories", key = "#id") // Décommenter si Redis est activé
    public CategoryDTO getCategoryById(Long id) {
        log.info("Fetching category {} from database", id);
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));
        return convertToDTO(category);
    }
    
    @Transactional(readOnly = true)
    public SubCategoryDTO getSubCategoryById(Long id) {
        log.info("Fetching subcategory {} from database", id);
        SubCategory subCategory = subCategoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SubCategory", id));
        return convertSubCategoryToDTO(subCategory);
    }
    
    private CategoryDTO convertToDTO(Category category) {
        CategoryDTO dto = new CategoryDTO();
        dto.setId(category.getId());
        dto.setName(category.getName());
        dto.setDescription(category.getDescription());
        dto.setIcon(category.getIcon());
        dto.setColor(category.getColor());
        dto.setIsLocked(category.getIsLocked());
        dto.setLockedBy(category.getLockedBy());
        dto.setLockedAt(category.getLockedAt());
        
        List<SubCategoryDTO> subCategoryDTOs = category.getSubCategories().stream()
                .map(sub -> {
                    SubCategoryDTO subDto = new SubCategoryDTO();
                    subDto.setId(sub.getId());
                    subDto.setName(sub.getName());
                    subDto.setDescription(sub.getDescription());
                    subDto.setCategoryId(category.getId());
                    subDto.setIsLocked(sub.getIsLocked());
                    subDto.setLockedBy(sub.getLockedBy());
                    subDto.setLockedAt(sub.getLockedAt());
                    return subDto;
                })
                .collect(Collectors.toList());
        
        dto.setSubCategories(subCategoryDTOs);
        return dto;
    }
    
    @Transactional
    // @CacheEvict(value = "categories", allEntries = true) // Décommenter si Redis est activé
    public CategoryDTO createCategory(CreateCategoryRequest request) {
        Category category = new Category();
        category.setName(request.getName());
        category.setDescription(request.getDescription());
        category.setIcon(request.getIcon());
        category.setColor(request.getColor());
        
        Category savedCategory = categoryRepository.save(category);
        log.info("Created category {}", savedCategory.getId());
        return convertToDTO(savedCategory);
    }
    
    @Transactional
    // @CacheEvict(value = "categories", allEntries = true) // Décommenter si Redis est activé
    public CategoryDTO updateCategory(Long id, CreateCategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));
        
        category.setName(request.getName());
        category.setDescription(request.getDescription());
        category.setIcon(request.getIcon());
        category.setColor(request.getColor());
        
        Category updatedCategory = categoryRepository.save(category);
        log.info("Updated category {}", id);
        return convertToDTO(updatedCategory);
    }
    
    @Transactional
    // @CacheEvict(value = "categories", allEntries = true) // Décommenter si Redis est activé
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));
        categoryRepository.delete(category);
        log.info("Deleted category {}", id);
    }
    
    @Transactional
    // @CacheEvict(value = "categories", allEntries = true) // Décommenter si Redis est activé
    public SubCategoryDTO createSubCategory(CreateSubCategoryRequest request) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", request.getCategoryId()));
        
        SubCategory subCategory = new SubCategory();
        subCategory.setName(request.getName());
        subCategory.setDescription(request.getDescription());
        subCategory.setCategory(category);
        
        SubCategory savedSubCategory = subCategoryRepository.save(subCategory);
        log.info("Created subcategory {} in category {}", savedSubCategory.getId(), request.getCategoryId());
        return convertSubCategoryToDTO(savedSubCategory);
    }
    
    @Transactional
    // @CacheEvict(value = "categories", allEntries = true) // Décommenter si Redis est activé
    public SubCategoryDTO updateSubCategory(Long id, CreateSubCategoryRequest request) {
        SubCategory subCategory = subCategoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SubCategory", id));
        
        if (!subCategory.getCategory().getId().equals(request.getCategoryId())) {
            Category newCategory = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", request.getCategoryId()));
            subCategory.setCategory(newCategory);
        }
        
        subCategory.setName(request.getName());
        subCategory.setDescription(request.getDescription());
        
        SubCategory updatedSubCategory = subCategoryRepository.save(subCategory);
        log.info("Updated subcategory {}", id);
        return convertSubCategoryToDTO(updatedSubCategory);
    }
    
    @Transactional
    // @CacheEvict(value = "categories", allEntries = true) // Décommenter si Redis est activé
    public void deleteSubCategory(Long id) {
        SubCategory subCategory = subCategoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SubCategory", id));
        subCategoryRepository.delete(subCategory);
        log.info("Deleted subcategory {}", id);
    }
    
    private SubCategoryDTO convertSubCategoryToDTO(SubCategory subCategory) {
        SubCategoryDTO dto = new SubCategoryDTO();
        dto.setId(subCategory.getId());
        dto.setName(subCategory.getName());
        dto.setDescription(subCategory.getDescription());
        dto.setCategoryId(subCategory.getCategory().getId());
        dto.setCategoryName(subCategory.getCategory().getName());
        dto.setRequiresClubMembership(subCategory.getRequiresClubMembership());
        dto.setIsLocked(subCategory.getIsLocked());
        dto.setLockedBy(subCategory.getLockedBy());
        dto.setLockedAt(subCategory.getLockedAt());
        dto.setCreatedAt(subCategory.getCreatedAt());
        dto.setUpdatedAt(subCategory.getUpdatedAt());
        return dto;
    }
    
    // Category locking methods
    @Transactional
    // @CacheEvict(value = "categories", allEntries = true)
    public void lockCategory(Long id, Long userId) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));
        
        category.setIsLocked(true);
        category.setLockedBy(userId);
        category.setLockedAt(java.time.LocalDateTime.now());
        
        categoryRepository.save(category);
        log.info("Locked category {} by user {}", id, userId);
    }
    
    @Transactional
    // @CacheEvict(value = "categories", allEntries = true)
    public void unlockCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));
        
        category.setIsLocked(false);
        category.setLockedBy(null);
        category.setLockedAt(null);
        
        categoryRepository.save(category);
        log.info("Unlocked category {}", id);
    }
}
