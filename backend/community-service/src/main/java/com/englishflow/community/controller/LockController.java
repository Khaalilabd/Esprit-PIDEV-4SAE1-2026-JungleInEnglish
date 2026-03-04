package com.englishflow.community.controller;

import com.englishflow.community.service.LockService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/community/lock")
@RequiredArgsConstructor
public class LockController {
    
    private final LockService lockService;
    
    @PostMapping("/category/{categoryId}")
    public ResponseEntity<?> lockCategory(
            @PathVariable Long categoryId,
            @RequestParam Long userId) {
        lockService.lockCategory(categoryId, userId);
        return ResponseEntity.ok().build();
    }
    
    @DeleteMapping("/category/{categoryId}")
    public ResponseEntity<?> unlockCategory(
            @PathVariable Long categoryId,
            @RequestParam Long userId) {
        lockService.unlockCategory(categoryId, userId);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/subcategory/{subCategoryId}")
    public ResponseEntity<?> lockSubCategory(
            @PathVariable Long subCategoryId,
            @RequestParam Long userId) {
        lockService.lockSubCategory(subCategoryId, userId);
        return ResponseEntity.ok().build();
    }
    
    @DeleteMapping("/subcategory/{subCategoryId}")
    public ResponseEntity<?> unlockSubCategory(
            @PathVariable Long subCategoryId,
            @RequestParam Long userId) {
        lockService.unlockSubCategory(subCategoryId, userId);
        return ResponseEntity.ok().build();
    }
}
