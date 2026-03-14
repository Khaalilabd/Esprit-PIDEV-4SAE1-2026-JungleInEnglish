package com.englishflow.courses.service;

import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
@Slf4j
public class ImageOptimizationService {
    
    private static final int MAX_WIDTH = 1920;
    private static final int MAX_HEIGHT = 1080;
    private static final int THUMBNAIL_WIDTH = 400;
    private static final int THUMBNAIL_HEIGHT = 300;
    private static final double COMPRESSION_QUALITY = 0.85;
    
    /**
     * Optimize course thumbnail
     */
    public byte[] optimizeThumbnail(MultipartFile file) throws IOException {
        log.info("Optimizing course thumbnail: {} (original size: {} bytes)", 
                file.getOriginalFilename(), file.getSize());
        
        BufferedImage originalImage = ImageIO.read(file.getInputStream());
        if (originalImage == null) {
            throw new IOException("Invalid image file");
        }
        
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        
        Thumbnails.of(originalImage)
                .size(MAX_WIDTH, MAX_HEIGHT)
                .outputQuality(COMPRESSION_QUALITY)
                .outputFormat("jpg")
                .toOutputStream(outputStream);
        
        byte[] optimizedBytes = outputStream.toByteArray();
        log.info("Thumbnail optimized: {} -> {} bytes ({}% reduction)", 
                file.getSize(), 
                optimizedBytes.length,
                (int)((1 - (double)optimizedBytes.length / file.getSize()) * 100));
        
        return optimizedBytes;
    }
    
    /**
     * Generate small thumbnail for course lists
     */
    public byte[] generateSmallThumbnail(MultipartFile file) throws IOException {
        log.info("Generating small thumbnail for: {}", file.getOriginalFilename());
        
        BufferedImage originalImage = ImageIO.read(file.getInputStream());
        if (originalImage == null) {
            throw new IOException("Invalid image file");
        }
        
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        
        Thumbnails.of(originalImage)
                .size(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT)
                .outputQuality(COMPRESSION_QUALITY)
                .outputFormat("jpg")
                .toOutputStream(outputStream);
        
        return outputStream.toByteArray();
    }
    
    /**
     * Generate small thumbnail from byte array
     */
    public byte[] generateSmallThumbnailFromBytes(byte[] imageBytes) throws IOException {
        ByteArrayInputStream inputStream = new ByteArrayInputStream(imageBytes);
        BufferedImage originalImage = ImageIO.read(inputStream);
        
        if (originalImage == null) {
            throw new IOException("Invalid image data");
        }
        
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        
        Thumbnails.of(originalImage)
                .size(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT)
                .outputQuality(COMPRESSION_QUALITY)
                .outputFormat("jpg")
                .toOutputStream(outputStream);
        
        return outputStream.toByteArray();
    }
    
    /**
     * Validate image file
     */
    public boolean isValidImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return false;
        }
        
        String contentType = file.getContentType();
        if (contentType == null) {
            return false;
        }
        
        return contentType.equals("image/jpeg") || 
               contentType.equals("image/jpg") || 
               contentType.equals("image/png") || 
               contentType.equals("image/gif") ||
               contentType.equals("image/webp");
    }
}
