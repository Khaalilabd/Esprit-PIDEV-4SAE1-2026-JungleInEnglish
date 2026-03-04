package com.englishflow.community.service;

import com.englishflow.community.entity.Category;
import com.englishflow.community.entity.SubCategory;
import com.englishflow.community.exception.ResourceNotFoundException;
import com.englishflow.community.repository.CategoryRepository;
import com.englishflow.community.repository.SubCategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class PermissionService {
    
    private final SubCategoryRepository subCategoryRepository;
    private final CategoryRepository categoryRepository;
    
    /**
     * Check if a user can create a topic in a subcategory
     * @param subCategoryId The subcategory ID
     * @param userRole The user's role (STUDENT, TUTOR, ACADEMIC_OFFICE_AFFAIR, ADMIN)
     * @return true if user can create topic, false otherwise
     */
    public boolean canCreateTopic(Long subCategoryId, String userRole) {
        SubCategory subCategory = subCategoryRepository.findById(subCategoryId)
                .orElseThrow(() -> new ResourceNotFoundException("SubCategory not found with id: " + subCategoryId));
        
        Category category = subCategory.getCategory();
        
        // If category is locked, only ACADEMIC_OFFICE_AFFAIR can create topics
        if (category.getIsLocked() != null && category.getIsLocked()) {
            log.debug("Category {} is locked, checking if user role {} is ACADEMIC_OFFICE_AFFAIR", category.getId(), userRole);
            return "ACADEMIC_OFFICE_AFFAIR".equals(userRole);
        }
        
        // If subcategory is locked, only ACADEMIC_OFFICE_AFFAIR can create topics
        if (subCategory.getIsLocked() != null && subCategory.getIsLocked()) {
            log.debug("SubCategory {} is locked, checking if user role {} is ACADEMIC_OFFICE_AFFAIR", subCategoryId, userRole);
            return "ACADEMIC_OFFICE_AFFAIR".equals(userRole);
        }
        
        // Otherwise, everyone can create topics
        return true;
    }
    
    /**
     * Check if a user can reply to a topic in a subcategory
     * When category/subcategory is locked, NOBODY can reply (not even ACADEMIC_OFFICE_AFFAIR)
     * This is for official announcements where no replies are allowed
     * @param subCategoryId The subcategory ID
     * @param userRole The user's role
     * @return true if user can reply, false otherwise
     */
    public boolean canReplyToTopic(Long subCategoryId, String userRole) {
        SubCategory subCategory = subCategoryRepository.findById(subCategoryId)
                .orElseThrow(() -> new ResourceNotFoundException("SubCategory not found with id: " + subCategoryId));
        
        Category category = subCategory.getCategory();
        
        // If category is locked, NOBODY can reply (including ACADEMIC_OFFICE_AFFAIR)
        if (category.getIsLocked() != null && category.getIsLocked()) {
            log.debug("Category {} is locked, no replies allowed", category.getId());
            return false;
        }
        
        // If subcategory is locked, NOBODY can reply (including ACADEMIC_OFFICE_AFFAIR)
        if (subCategory.getIsLocked() != null && subCategory.getIsLocked()) {
            log.debug("SubCategory {} is locked, no replies allowed", subCategoryId);
            return false;
        }
        
        // Otherwise, everyone can reply
        return true;
    }
    
    /**
     * Get permission info for a subcategory
     * @param subCategoryId The subcategory ID
     * @param userRole The user's role
     * @return PermissionInfo object
     */
    public PermissionInfo getPermissionInfo(Long subCategoryId, String userRole) {
        SubCategory subCategory = subCategoryRepository.findById(subCategoryId)
                .orElseThrow(() -> new ResourceNotFoundException("SubCategory not found with id: " + subCategoryId));
        
        Category category = subCategory.getCategory();
        
        boolean canCreate = canCreateTopic(subCategoryId, userRole);
        boolean canReply = canReplyToTopic(subCategoryId, userRole);
        boolean categoryLocked = category.getIsLocked() != null && category.getIsLocked();
        boolean subCategoryLocked = subCategory.getIsLocked() != null && subCategory.getIsLocked();
        
        return new PermissionInfo(canCreate, canReply, categoryLocked, subCategoryLocked);
    }
    
    public static class PermissionInfo {
        public boolean canCreateTopic;
        public boolean canReply;
        public boolean categoryLocked;
        public boolean subCategoryLocked;
        
        public PermissionInfo(boolean canCreateTopic, boolean canReply, boolean categoryLocked, boolean subCategoryLocked) {
            this.canCreateTopic = canCreateTopic;
            this.canReply = canReply;
            this.categoryLocked = categoryLocked;
            this.subCategoryLocked = subCategoryLocked;
        }
    }
}
