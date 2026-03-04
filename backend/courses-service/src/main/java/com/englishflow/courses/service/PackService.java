package com.englishflow.courses.service;

import com.englishflow.courses.dto.PackDTO;
import com.englishflow.courses.entity.Pack;
import com.englishflow.courses.enums.PackStatus;
import com.englishflow.courses.repository.PackRepository;
import com.englishflow.courses.repository.PackEnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PackService implements IPackService {
    
    private final PackRepository packRepository;
    private final PackEnrollmentRepository enrollmentRepository;
    private final com.englishflow.courses.client.MessagingServiceClient messagingServiceClient;
    
    @Override
    @Transactional
    public PackDTO createPack(PackDTO packDTO) {
        Pack pack = new Pack();
        pack.setName(packDTO.getName());
        pack.setCategory(packDTO.getCategory());
        pack.setLevel(packDTO.getLevel());
        pack.setTutorId(packDTO.getTutorId());
        pack.setTutorName(packDTO.getTutorName());
        pack.setTutorRating(packDTO.getTutorRating() != null ? packDTO.getTutorRating() : 0.0);
        pack.setCourseIds(packDTO.getCourseIds());
        pack.setPrice(packDTO.getPrice());
        pack.setEstimatedDuration(packDTO.getEstimatedDuration());
        pack.setMaxStudents(packDTO.getMaxStudents());
        pack.setEnrollmentStartDate(packDTO.getEnrollmentStartDate());
        pack.setEnrollmentEndDate(packDTO.getEnrollmentEndDate());
        pack.setDescription(packDTO.getDescription());
        pack.setStatus(packDTO.getStatus() != null ? packDTO.getStatus() : PackStatus.DRAFT);
        pack.setCreatedBy(packDTO.getCreatedBy());
        
        Pack saved = packRepository.save(pack);
        
        // Créer automatiquement un groupe de discussion pour le pack avec le tuteur
        try {
            List<Long> initialParticipants = new java.util.ArrayList<>();
            initialParticipants.add(packDTO.getTutorId());
            
            Long conversationId = messagingServiceClient.createPackGroup(
                packDTO.getName(),
                packDTO.getDescription(),
                packDTO.getTutorId(),
                initialParticipants
            );
            
            if (conversationId != null) {
                saved.setConversationId(conversationId);
                saved = packRepository.save(saved);
            }
        } catch (Exception e) {
            System.err.println("Failed to create messaging group for pack: " + e.getMessage());
        }
        
        return toDTO(saved);
    }
    
    @Override
    @Transactional
    public PackDTO updatePack(Long id, PackDTO packDTO) {
        Pack pack = packRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Pack not found with id: " + id));
        
        pack.setName(packDTO.getName());
        pack.setCategory(packDTO.getCategory());
        pack.setLevel(packDTO.getLevel());
        pack.setCourseIds(packDTO.getCourseIds());
        pack.setPrice(packDTO.getPrice());
        pack.setEstimatedDuration(packDTO.getEstimatedDuration());
        pack.setMaxStudents(packDTO.getMaxStudents());
        pack.setEnrollmentStartDate(packDTO.getEnrollmentStartDate());
        pack.setEnrollmentEndDate(packDTO.getEnrollmentEndDate());
        pack.setDescription(packDTO.getDescription());
        pack.setStatus(packDTO.getStatus());
        
        Pack updated = packRepository.save(pack);
        return toDTO(updated);
    }
    
    @Override
    public PackDTO getById(Long id) {
        return packRepository.findById(id)
            .map(this::toDTO)
            .orElseThrow(() -> new RuntimeException("Pack not found with id: " + id));
    }
    
    @Override
    public List<PackDTO> getAllPacks() {
        return packRepository.findAll().stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }
    
    @Override
    public List<PackDTO> getByTutorId(Long tutorId) {
        return packRepository.findByTutorId(tutorId).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }
    
    @Override
    public List<PackDTO> getByStatus(PackStatus status) {
        return packRepository.findByStatus(status).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }
    
    @Override
    public List<PackDTO> getByCategoryAndLevel(String category, String level) {
        return packRepository.findByCategoryAndLevel(category, level).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }
    
    @Override
    public List<PackDTO> getAvailablePacksByCategoryAndLevel(String category, String level) {
        return packRepository.findAvailablePacksByCategoryAndLevel(category, level).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }
    
    @Override
    public List<PackDTO> getAllAvailablePacks() {
        return packRepository.findAllAvailablePacks().stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }
    
    @Override
    public List<PackDTO> getByCreatedBy(Long academicId) {
        return packRepository.findByCreatedBy(academicId).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public void deletePack(Long id) {
        Pack pack = packRepository.findById(id).orElse(null);
        
        // Supprimer le groupe de discussion si existant
        if (pack != null && pack.getConversationId() != null) {
            try {
                messagingServiceClient.deletePackGroup(pack.getConversationId());
            } catch (Exception e) {
                System.err.println("Failed to delete messaging group: " + e.getMessage());
            }
        }
        
        // First, delete all enrollments for this pack
        enrollmentRepository.deleteByPackId(id);
        
        // Then delete the pack
        packRepository.deleteById(id);
    }
    
    @Override
    @Transactional
    public void incrementEnrollment(Long packId) {
        Pack pack = packRepository.findById(packId)
            .orElseThrow(() -> new RuntimeException("Pack not found with id: " + packId));
        
        pack.setCurrentEnrolledStudents(pack.getCurrentEnrolledStudents() + 1);
        
        // Update status if full
        if (pack.isFull()) {
            pack.setStatus(PackStatus.FULL);
        }
        
        packRepository.save(pack);
    }
    
    @Override
    @Transactional
    public void decrementEnrollment(Long packId) {
        Pack pack = packRepository.findById(packId)
            .orElseThrow(() -> new RuntimeException("Pack not found with id: " + packId));
        
        if (pack.getCurrentEnrolledStudents() > 0) {
            pack.setCurrentEnrolledStudents(pack.getCurrentEnrolledStudents() - 1);
            
            // Update status if was full
            if (pack.getStatus() == PackStatus.FULL && !pack.isFull()) {
                pack.setStatus(PackStatus.ACTIVE);
            }
            
            packRepository.save(pack);
        }
    }
    
    private PackDTO toDTO(Pack pack) {
        PackDTO dto = new PackDTO();
        dto.setId(pack.getId());
        dto.setName(pack.getName());
        dto.setCategory(pack.getCategory());
        dto.setLevel(pack.getLevel());
        dto.setTutorId(pack.getTutorId());
        dto.setTutorName(pack.getTutorName());
        dto.setTutorRating(pack.getTutorRating());
        dto.setCourseIds(pack.getCourseIds());
        dto.setCoursesCount(pack.getCourseIds() != null ? pack.getCourseIds().size() : 0);
        dto.setPrice(pack.getPrice());
        dto.setEstimatedDuration(pack.getEstimatedDuration());
        dto.setMaxStudents(pack.getMaxStudents());
        dto.setCurrentEnrolledStudents(pack.getCurrentEnrolledStudents());
        dto.setAvailableSlots(pack.getAvailableSlots());
        dto.setEnrollmentPercentage(pack.getEnrollmentPercentage());
        dto.setEnrollmentStartDate(pack.getEnrollmentStartDate());
        dto.setEnrollmentEndDate(pack.getEnrollmentEndDate());
        dto.setDescription(pack.getDescription());
        dto.setStatus(pack.getStatus());
        dto.setCreatedBy(pack.getCreatedBy());
        dto.setConversationId(pack.getConversationId());
        dto.setCreatedAt(pack.getCreatedAt());
        dto.setUpdatedAt(pack.getUpdatedAt());
        dto.setIsEnrollmentOpen(pack.isEnrollmentOpen());
        return dto;
    }
}
