package com.englishflow.community.controller;

import com.englishflow.community.dto.CategoryDTO;
import com.englishflow.community.dto.CreateCategoryRequest;
import com.englishflow.community.dto.CreateSubCategoryRequest;
import com.englishflow.community.dto.SubCategoryDTO;
import com.englishflow.community.service.CategoryService;
import com.englishflow.community.service.DataInitializationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/community/categories")
@RequiredArgsConstructor
@Tag(name = "Categories", description = "Category and SubCategory management endpoints")
public class CommunityController {
    
    private final CategoryService categoryService;
    private final DataInitializationService dataInitializationService;

    @GetMapping("/health")
    @Operation(summary = "Health check", description = "Check if the community service is running")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Community service is running");
    }
    
    @PostMapping("/initialize")
    @Operation(summary = "Initialize data", description = "Initialize default categories and subcategories")
    public ResponseEntity<String> initializeData() {
        dataInitializationService.initializeCategories();
        return ResponseEntity.ok("Categories initialized successfully");
    }
    
    @GetMapping
    @Operation(summary = "Get all categories", description = "Retrieve all categories with their subcategories")
    public ResponseEntity<List<CategoryDTO>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Get category by ID", description = "Retrieve a specific category by its ID")
    public ResponseEntity<CategoryDTO> getCategoryById(@PathVariable Long id) {
        return ResponseEntity.ok(categoryService.getCategoryById(id));
    }
    
    @PostMapping
    @Operation(summary = "Create category", description = "Create a new category")
    public ResponseEntity<CategoryDTO> createCategory(@Valid @RequestBody CreateCategoryRequest request) {
        CategoryDTO category = categoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(category);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<CategoryDTO> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CreateCategoryRequest request) {
        CategoryDTO category = categoryService.updateCategory(id, request);
        return ResponseEntity.ok(category);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
    
    // SubCategory endpoints
    @GetMapping("/subcategories/{id}")
    @Operation(summary = "Get subcategory by ID", description = "Retrieve a specific subcategory by its ID")
    public ResponseEntity<SubCategoryDTO> getSubCategoryById(@PathVariable Long id) {
        SubCategoryDTO subCategory = categoryService.getSubCategoryById(id);
        return ResponseEntity.ok(subCategory);
    }
    
    @PostMapping("/subcategories")
    public ResponseEntity<SubCategoryDTO> createSubCategory(@Valid @RequestBody CreateSubCategoryRequest request) {
        SubCategoryDTO subCategory = categoryService.createSubCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(subCategory);
    }
    
    @PutMapping("/subcategories/{id}")
    public ResponseEntity<SubCategoryDTO> updateSubCategory(
            @PathVariable Long id,
            @Valid @RequestBody CreateSubCategoryRequest request) {
        SubCategoryDTO subCategory = categoryService.updateSubCategory(id, request);
        return ResponseEntity.ok(subCategory);
    }
    
    @DeleteMapping("/subcategories/{id}")
    public ResponseEntity<Void> deleteSubCategory(@PathVariable Long id) {
        categoryService.deleteSubCategory(id);
        return ResponseEntity.noContent().build();
    }
}
