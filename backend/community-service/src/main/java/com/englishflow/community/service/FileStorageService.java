package com.englishflow.community.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageService {
    
    private final Path fileStorageLocation;
    
    @Value("${server.port:8082}")
    private String serverPort;
    
    public FileStorageService(@Value("${file.upload-dir:uploads}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        
        try {
            Files.createDirectories(this.fileStorageLocation);
            log.info("Upload directory created/verified at: {}", this.fileStorageLocation);
        } catch (Exception ex) {
            log.error("Could not create upload directory!", ex);
            throw new RuntimeException("Could not create upload directory!", ex);
        }
    }
    
    public String storeFile(MultipartFile file) {
        try {
            log.info("Starting file storage process for: {}", file.getOriginalFilename());
            
            // Normalize file name
            String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
            log.info("Normalized file name: {}", originalFileName);
            
            // Check for invalid characters
            if (originalFileName.contains("..")) {
                throw new RuntimeException("Invalid file name: " + originalFileName);
            }
            
            // Generate unique file name
            String fileExtension = "";
            int dotIndex = originalFileName.lastIndexOf('.');
            if (dotIndex > 0) {
                fileExtension = originalFileName.substring(dotIndex);
            }
            String fileName = UUID.randomUUID().toString() + fileExtension;
            log.info("Generated unique file name: {}", fileName);
            
            // Copy file to the target location
            Path targetLocation = this.fileStorageLocation.resolve(fileName);
            log.info("Target file location: {}", targetLocation.toAbsolutePath());
            
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            
            log.info("File stored successfully: {}", fileName);
            
            // Return URL through API Gateway
            String fileUrl = "/uploads/" + fileName;
            log.info("File URL: {}", fileUrl);
            return fileUrl;
            
        } catch (IOException ex) {
            log.error("Could not store file. Error: {}", ex.getMessage(), ex);
            throw new RuntimeException("Could not store file. Please try again!", ex);
        }
    }
    
    public void deleteFile(String filePath) {
        try {
            if (filePath != null && filePath.startsWith("/uploads/")) {
                String fileName = filePath.substring("/uploads/".length());
                Path file = this.fileStorageLocation.resolve(fileName);
                Files.deleteIfExists(file);
                log.info("File deleted successfully: {}", fileName);
            }
        } catch (IOException ex) {
            log.error("Could not delete file. Error: {}", ex.getMessage());
        }
    }
}
