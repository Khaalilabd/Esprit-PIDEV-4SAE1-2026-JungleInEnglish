package com.englishflow.auth.service;

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
    
    private static final int MAX_WIDTH = 1200;
    private static final int MAX_HEIGHT = 1200;
    private static final int THUMBNAIL_SIZE = 200;
    private static final double COMPRESSION_QUALITY = 0.85;
    
    /**
     * Optimize image by resizing and compressing
     */
    public byte[] optimizeImage(MultipartFile file) throws IOException {
        log.info("Optimizing image: {} (original size: {} bytes)", file.getOriginalFilename(), file.getSize());
        
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
        log.info("Image optimized: {} -> {} bytes ({}% reduction)", 
                file.getSize(), 
                optimizedBytes.length,
                (int)((1 - (double)optimizedBytes.length / file.getSize()) * 100));
        
        return optimizedBytes;
    }
    
    /**
     * Generate thumbnail from image
     */
    public byte[] generateThumbnail(MultipartFile file) throws IOException {
        log.info("Generating thumbnail for: {}", file.getOriginalFilename());
        
        BufferedImage originalImage = ImageIO.read(file.getInputStream());
        if (originalImage == null) {
            throw new IOException("Invalid image file");
        }
        
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        
        Thumbnails.of(originalImage)
                .size(THUMBNAIL_SIZE, THUMBNAIL_SIZE)
                .outputQuality(COMPRESSION_QUALITY)
                .outputFormat("jpg")
                .toOutputStream(outputStream);
        
        return outputStream.toByteArray();
    }
    
    /**
     * Generate thumbnail from byte array
     */
    public byte[] generateThumbnailFromBytes(byte[] imageBytes) throws IOException {
        ByteArrayInputStream inputStream = new ByteArrayInputStream(imageBytes);
        BufferedImage originalImage = ImageIO.read(inputStream);
        
        if (originalImage == null) {
            throw new IOException("Invalid image data");
        }
        
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        
        Thumbnails.of(originalImage)
                .size(THUMBNAIL_SIZE, THUMBNAIL_SIZE)
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
    
    /**
     * Get image dimensions
     */
    public ImageDimensions getImageDimensions(MultipartFile file) throws IOException {
        BufferedImage image = ImageIO.read(file.getInputStream());
        if (image == null) {
            throw new IOException("Invalid image file");
        }
        return new ImageDimensions(image.getWidth(), image.getHeight());
    }
    
    public record ImageDimensions(int width, int height) {}
}
