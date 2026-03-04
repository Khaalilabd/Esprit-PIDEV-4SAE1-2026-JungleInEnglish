package com.englishflow.community.controller;

import com.englishflow.community.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/community/files")
@RequiredArgsConstructor
@Slf4j
public class FileUploadController {
    
    private final FileStorageService fileStorageService;
    
    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            log.info("=== FILE UPLOAD REQUEST RECEIVED ===");
            log.info("File name: {}", file.getOriginalFilename());
            log.info("File size: {} bytes", file.getSize());
            log.info("Content type: {}", file.getContentType());
            
            // Validate file
            if (file.isEmpty()) {
                log.error("File is empty");
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Please select a file to upload");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            // Check file size (max 50MB)
            if (file.getSize() > 50 * 1024 * 1024) {
                log.error("File size too large: {} bytes", file.getSize());
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "File size must be less than 50MB");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            // Check file type
            String contentType = file.getContentType();
            log.info("Validating file content type: {}", contentType);
            
            if (contentType == null || 
                (!contentType.startsWith("image/") && 
                 !contentType.equals("application/pdf") &&
                 !contentType.startsWith("video/"))) {
                log.error("Invalid file type: {}", contentType);
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Only images, PDFs, and videos are allowed");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            log.info("File validation passed, storing file...");
            String filePath = fileStorageService.storeFile(file);
            log.info("File stored successfully at: {}", filePath);
            
            Map<String, String> response = new HashMap<>();
            response.put("filePath", filePath);
            response.put("fileName", file.getOriginalFilename());
            response.put("fileType", contentType);
            
            log.info("=== FILE UPLOAD SUCCESSFUL ===");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("=== ERROR UPLOADING FILE ===", e);
            log.error("Exception type: {}", e.getClass().getName());
            log.error("Exception message: {}", e.getMessage());
            if (e.getCause() != null) {
                log.error("Cause: {}", e.getCause().getMessage());
            }
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error uploading file: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
}
