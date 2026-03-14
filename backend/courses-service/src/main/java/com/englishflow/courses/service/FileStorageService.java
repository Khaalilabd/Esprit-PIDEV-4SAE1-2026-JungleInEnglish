package com.englishflow.courses.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileStorageService {

    private final ImageOptimizationService imageOptimizationService;

    @Value("${file.upload-dir:uploads/courses}")
    private String uploadDir;
    
    @Value("${server.port:8086}")
    private String serverPort;

    /**
     * Store a file and return its URL
     */
    public String storeFile(MultipartFile file, String subDirectory) {
        return storeFile(file, subDirectory, false);
    }

    /**
     * Store a file with optional optimization
     */
    public String storeFile(MultipartFile file, String subDirectory, boolean optimize) {
        try {
            // Create directory if it doesn't exist
            Path uploadPath = Paths.get(uploadDir, subDirectory);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate unique filename
            String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
            String fileExtension = optimize && isValidImageFile(file) ? ".jpg" : getFileExtension(originalFilename);
            String newFilename = UUID.randomUUID().toString() + fileExtension;

            // Copy file to target location
            Path targetLocation = uploadPath.resolve(newFilename);
            
            if (optimize && isValidImageFile(file)) {
                // Optimize image before saving
                log.info("Optimizing image: {}", originalFilename);
                byte[] optimizedImage = imageOptimizationService.optimizeThumbnail(file);
                Files.write(targetLocation, optimizedImage);
                
                // Generate small thumbnail for lists
                String smallThumbFilename = "small_" + newFilename;
                Path smallThumbPath = uploadPath.resolve(smallThumbFilename);
                byte[] smallThumb = imageOptimizationService.generateSmallThumbnailFromBytes(optimizedImage);
                Files.write(smallThumbPath, smallThumb);
                log.info("Small thumbnail generated: {}", smallThumbFilename);
            } else {
                // Save without optimization
                Files.write(targetLocation, file.getBytes());
            }

            log.info("File stored successfully: {}", targetLocation);

            // Return URL accessible via API Gateway
            return "/uploads/courses/" + subDirectory + "/" + newFilename;

        } catch (IOException ex) {
            log.error("Could not store file. Error: {}", ex.getMessage());
            throw new RuntimeException("Could not store file. Please try again!", ex);
        }
    }

    /**
     * Store thumbnail image with optimization
     */
    public String storeThumbnail(MultipartFile file) {
        return storeFile(file, "thumbnails", true);
    }

    /**
     * Store course material file
     */
    public String storeCourseMaterial(MultipartFile file) {
        return storeFile(file, "materials", false);
    }

    /**
     * Delete a file and its thumbnails
     */
    public void deleteFile(String fileUrl) {
        try {
            if (fileUrl != null && !fileUrl.isEmpty()) {
                // Remove leading slash if present
                String filePath = fileUrl.startsWith("/") ? fileUrl.substring(1) : fileUrl;
                Path path = Paths.get(filePath);
                Files.deleteIfExists(path);
                
                // Delete small thumbnail if exists
                String fileName = path.getFileName().toString();
                Path smallThumbPath = path.getParent().resolve("small_" + fileName);
                Files.deleteIfExists(smallThumbPath);
                
                log.info("Deleted file and thumbnails: {}", filePath);
            }
        } catch (IOException ex) {
            log.error("Could not delete file: {}. Error: {}", fileUrl, ex.getMessage());
        }
    }

    /**
     * Get small thumbnail URL
     */
    public String getSmallThumbnailUrl(String imageUrl) {
        if (imageUrl == null || !imageUrl.contains("/")) {
            return imageUrl;
        }
        int lastSlash = imageUrl.lastIndexOf("/");
        return imageUrl.substring(0, lastSlash + 1) + "small_" + imageUrl.substring(lastSlash + 1);
    }

    /**
     * Validate if file is an image
     */
    public boolean isValidImageFile(MultipartFile file) {
        return imageOptimizationService.isValidImage(file);
    }

    /**
     * Validate if file is a valid course material
     */
    public boolean isValidCourseMaterial(MultipartFile file) {
        String contentType = file.getContentType();
        return contentType != null && (
                contentType.equals("application/pdf") ||
                contentType.equals("application/msword") ||
                contentType.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document") ||
                contentType.equals("application/vnd.ms-powerpoint") ||
                contentType.equals("application/vnd.openxmlformats-officedocument.presentationml.presentation") ||
                contentType.equals("video/mp4") ||
                contentType.equals("audio/mpeg") ||
                contentType.equals("application/zip")
        );
    }

    /**
     * Validate file size
     */
    public boolean isValidFileSize(MultipartFile file, long maxSize) {
        return file.getSize() <= maxSize;
    }

    /**
     * Get file extension
     */
    private String getFileExtension(String filename) {
        if (filename == null || filename.isEmpty()) {
            return "";
        }
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex == -1) {
            return "";
        }
        return filename.substring(lastDotIndex);
    }
}
