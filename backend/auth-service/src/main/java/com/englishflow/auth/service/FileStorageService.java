package com.englishflow.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
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

    @Value("${file.upload-dir:uploads/profile-photos}")
    private String uploadDir;

    public String storeFile(MultipartFile file) throws IOException {
        return storeFile(file, true);
    }

    public String storeFile(MultipartFile file, boolean optimize) throws IOException {
        // Créer le répertoire s'il n'existe pas
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Générer un nom de fichier unique
        String originalFilename = file.getOriginalFilename();
        String fileExtension = ".jpg"; // Force JPG pour les images optimisées
        if (!optimize && originalFilename != null && originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String fileName = UUID.randomUUID().toString() + fileExtension;

        // Sauvegarder le fichier
        Path filePath = uploadPath.resolve(fileName);
        
        if (optimize && imageOptimizationService.isValidImage(file)) {
            // Optimiser l'image avant de la sauvegarder
            log.info("Optimizing image before storage: {}", originalFilename);
            byte[] optimizedImage = imageOptimizationService.optimizeImage(file);
            Files.write(filePath, optimizedImage);
            
            // Générer et sauvegarder le thumbnail
            String thumbnailFileName = "thumb_" + fileName;
            Path thumbnailPath = uploadPath.resolve(thumbnailFileName);
            byte[] thumbnail = imageOptimizationService.generateThumbnailFromBytes(optimizedImage);
            Files.write(thumbnailPath, thumbnail);
            log.info("Thumbnail generated: {}", thumbnailFileName);
        } else {
            // Sauvegarder sans optimisation
            Files.write(filePath, file.getBytes());
        }

        // Retourner l'URL relative
        return "/" + uploadDir + "/" + fileName;
    }

    public void deleteFile(String fileUrl) {
        try {
            if (fileUrl != null && fileUrl.startsWith("/")) {
                Path filePath = Paths.get(fileUrl.substring(1)); // Enlever le / du début
                Files.deleteIfExists(filePath);
                
                // Supprimer aussi le thumbnail s'il existe
                String fileName = filePath.getFileName().toString();
                Path thumbnailPath = filePath.getParent().resolve("thumb_" + fileName);
                Files.deleteIfExists(thumbnailPath);
                log.info("Deleted file and thumbnail: {}", fileUrl);
            }
        } catch (IOException e) {
            log.error("Failed to delete file: {}", fileUrl, e);
        }
    }

    public boolean isValidImageFile(MultipartFile file) {
        return imageOptimizationService.isValidImage(file);
    }

    public boolean isValidFileSize(MultipartFile file, long maxSizeInBytes) {
        return file.getSize() <= maxSizeInBytes;
    }
    
    public String getThumbnailUrl(String imageUrl) {
        if (imageUrl == null || !imageUrl.contains("/")) {
            return imageUrl;
        }
        int lastSlash = imageUrl.lastIndexOf("/");
        return imageUrl.substring(0, lastSlash + 1) + "thumb_" + imageUrl.substring(lastSlash + 1);
    }
}
