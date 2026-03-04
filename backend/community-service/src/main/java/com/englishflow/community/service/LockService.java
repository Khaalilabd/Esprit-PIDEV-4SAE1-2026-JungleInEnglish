package com.englishflow.community.service;

import com.englishflow.community.entity.Category;
import com.englishflow.community.entity.SubCategory;
import com.englishflow.community.exception.ResourceNotFoundException;
import com.englishflow.community.exception.UnauthorizedException;
import com.englishflow.community.repository.CategoryRepository;
import com.englishflow.community.repository.SubCategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class LockService {
    
    private final CategoryRepository categoryRepository;
    private final SubCategoryRepository subCategoryRepository;
    
    @Transactional
    public void lockCategory(Long categoryId, Long userId) {
        log.info("Locking category {} by user {}", categoryId, userId);
        
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + categoryId));
        
        category.setIsLocked(true);
        category.setLockedBy(userId);
        category.setLockedAt(LocalDateTime.now());
        
        categoryRepository.save(category);
        log.info("Category {} locked successfully", categoryId);
    }
    
    @Transactional
    public void unlockCategory(Long categoryId, Long userId) {
        log.info("Unlocking category {} by user {}", categoryId, userId);
        
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + categoryId));
        
        category.setIsLocked(false);
        category.setLockedBy(null);
        category.setLockedAt(null);
        
        // Unlock all subcategories when unlocking the parent category
        for (SubCategory subCategory : category.getSubCategories()) {
            if (subCategory.getIsLocked() != null && subCategory.getIsLocked()) {
                log.info("Auto-unlocking subcategory {} as part of category unlock", subCategory.getId());
                subCategory.setIsLocked(false);
                subCategory.setLockedBy(null);
                subCategory.setLockedAt(null);
                subCategoryRepository.save(subCategory);
            }
        }
        
        categoryRepository.save(category);
        log.info("Category {} and all its subcategories unlocked successfully", categoryId);
    }
    
    @Transactional
    public void lockSubCategory(Long subCategoryId, Long userId) {
        log.info("Locking subcategory {} by user {}", subCategoryId, userId);
        
        SubCategory subCategory = subCategoryRepository.findById(subCategoryId)
                .orElseThrow(() -> new ResourceNotFoundException("SubCategory not found with id: " + subCategoryId));
        
        subCategory.setIsLocked(true);
        subCategory.setLockedBy(userId);
        subCategory.setLockedAt(LocalDateTime.now());
        
        subCategoryRepository.save(subCategory);
        log.info("SubCategory {} locked successfully", subCategoryId);
    }
    
    @Transactional
    public void unlockSubCategory(Long subCategoryId, Long userId) {
        log.info("Unlocking subcategory {} by user {}", subCategoryId, userId);
        
        SubCategory subCategory = subCategoryRepository.findById(subCategoryId)
                .orElseThrow(() -> new ResourceNotFoundException("SubCategory not found with id: " + subCategoryId));
        
        subCategory.setIsLocked(false);
        subCategory.setLockedBy(null);
        subCategory.setLockedAt(null);
        
        subCategoryRepository.save(subCategory);
        log.info("SubCategory {} unlocked successfully", subCategoryId);
    }
}
