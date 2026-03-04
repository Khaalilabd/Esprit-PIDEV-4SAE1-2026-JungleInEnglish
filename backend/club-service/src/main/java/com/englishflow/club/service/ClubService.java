package com.englishflow.club.service;

import com.englishflow.club.dto.ClubDTO;
import com.englishflow.club.dto.ClubWithRoleDTO;
import com.englishflow.club.entity.Club;
import com.englishflow.club.entity.Member;
import com.englishflow.club.enums.ClubCategory;
import com.englishflow.club.exception.ClubNotFoundException;
import com.englishflow.club.exception.UnauthorizedException;
import com.englishflow.club.mapper.ClubMapper;
import com.englishflow.club.repository.ClubRepository;
import com.englishflow.club.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClubService {
    
    private final ClubRepository clubRepository;
    private final MemberService memberService;
    private final MemberRepository memberRepository;
    private final ClubUpdateRequestService updateRequestService;
    private final ClubMapper clubMapper;
    
    @Cacheable(value = "clubs", key = "'all'")
    @Transactional(readOnly = true)
    public List<ClubDTO> getAllClubs() {
        log.debug("Fetching all clubs from database");
        return clubRepository.findAll().stream()
                .map(clubMapper::toDTO)
                .collect(Collectors.toList());
    }
    
    @Cacheable(value = "clubsByCategory", key = "#category")
    @Transactional(readOnly = true)
    public List<ClubDTO> getClubsByCategory(ClubCategory category) {
        log.debug("Fetching clubs by category: {}", category);
        return clubRepository.findByCategory(category).stream()
                .map(clubMapper::toDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ClubDTO> searchClubsByName(String name) {
        log.debug("Searching clubs by name: {}", name);
        return clubRepository.findByNameContainingIgnoreCase(name).stream()
                .map(clubMapper::toDTO)
                .collect(Collectors.toList());
    }
    
    @Cacheable(value = "clubById", key = "#id")
    @Transactional(readOnly = true)
    public ClubDTO getClubById(Integer id) {
        log.debug("Fetching club by id: {}", id);
        Club club = clubRepository.findById(id)
                .orElseThrow(() -> new ClubNotFoundException(id));
        return clubMapper.toDTO(club);
    }
    
    @Caching(evict = {
        @CacheEvict(value = "clubs", key = "'all'"),
        @CacheEvict(value = "clubsByCategory", allEntries = true)
    })
    @Transactional
    public ClubDTO createClub(ClubDTO clubDTO) {
        log.info("Creating new club: {}", clubDTO.getName());
        Club club = clubMapper.toEntity(clubDTO);
        Club savedClub = clubRepository.save(club);
        
        // Automatically add the creator as PRESIDENT
        if (clubDTO.getCreatedBy() != null) {
            memberService.addPresidentToClub(savedClub.getId(), clubDTO.getCreatedBy().longValue());
        }
        
        log.info("Club created successfully with id: {}", savedClub.getId());
        return clubMapper.toDTO(savedClub);
    }
    
    @CacheEvict(value = "clubById", key = "#id")
    @Transactional
    public ClubDTO updateClub(Integer id, ClubDTO clubDTO, Long requesterId) {
        log.info("Updating club id: {} by user: {}", id, requesterId);
        Club club = clubRepository.findById(id)
                .orElseThrow(() -> new ClubNotFoundException(id));
        
        // Verify that the requester is the president of the club
        boolean isPresident = memberService.isPresident(id, requesterId);
        if (!isPresident) {
            log.warn("Unauthorized update attempt on club {} by user {}", id, requesterId);
            throw new UnauthorizedException("Only the president can update club information");
        }
        
        // Créer une demande de modification au lieu de modifier directement
        updateRequestService.createUpdateRequest(id, clubDTO, requesterId);
        
        log.info("Update request created for club: {}", id);
        // Retourner le club actuel (non modifié)
        return clubMapper.toDTO(club);
    }
    
    @Caching(evict = {
        @CacheEvict(value = "clubs", key = "'all'"),
        @CacheEvict(value = "clubsByCategory", allEntries = true),
        @CacheEvict(value = "clubById", key = "#id")
    })
    @Transactional
    public void deleteClub(Integer id) {
        log.info("Deleting club id: {}", id);
        if (!clubRepository.existsById(id)) {
            throw new ClubNotFoundException(id);
        }
        clubRepository.deleteById(id);
        log.info("Club deleted successfully: {}", id);
    }
    
    @Transactional(readOnly = true)
    public List<ClubDTO> getPendingClubs() {
        log.debug("Fetching pending clubs");
        return clubRepository.findByStatus(com.englishflow.club.enums.ClubStatus.PENDING).stream()
                .map(clubMapper::toDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ClubDTO> getApprovedClubs() {
        log.debug("Fetching approved and suspended clubs");
        // Récupérer les clubs approuvés ET suspendus pour la gestion
        List<Club> clubs = clubRepository.findAll().stream()
                .filter(club -> club.getStatus() == com.englishflow.club.enums.ClubStatus.APPROVED 
                             || club.getStatus() == com.englishflow.club.enums.ClubStatus.SUSPENDED)
                .collect(Collectors.toList());
        
        return clubs.stream()
                .map(club -> {
                    ClubDTO dto = clubMapper.toDTO(club);
                    // Ajouter le nombre de membres
                    Long memberCount = memberRepository.countByClubId(club.getId());
                    dto.setCurrentMembersCount(memberCount != null ? memberCount.intValue() : 0);
                    return dto;
                })
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ClubDTO> getClubsByUser(Integer userId) {
        log.debug("Fetching clubs created by user: {}", userId);
        return clubRepository.findByCreatedBy(userId).stream()
                .map(clubMapper::toDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ClubWithRoleDTO> getClubsWithRoleByUser(Long userId) {
        log.debug("Fetching clubs with role for user: {}", userId);
        List<Member> memberships = memberRepository.findByUserId(userId);
        
        return memberships.stream()
                .map(member -> clubMapper.toClubWithRoleDTO(member.getClub(), member))
                .collect(Collectors.toList());
    }
    
    @Caching(evict = {
        @CacheEvict(value = "clubs", key = "'all'"),
        @CacheEvict(value = "clubById", key = "#id")
    })
    @Transactional
    public ClubDTO approveClub(Integer id, Integer reviewerId, String comment) {
        log.info("Approving club id: {} by reviewer: {}", id, reviewerId);
        Club club = clubRepository.findById(id)
                .orElseThrow(() -> new ClubNotFoundException(id));
        
        club.setStatus(com.englishflow.club.enums.ClubStatus.APPROVED);
        club.setReviewedBy(reviewerId);
        club.setReviewComment(comment);
        
        Club updatedClub = clubRepository.save(club);
        log.info("Club approved successfully: {}", id);
        return clubMapper.toDTO(updatedClub);
    }
    
    @Caching(evict = {
        @CacheEvict(value = "clubs", key = "'all'"),
        @CacheEvict(value = "clubById", key = "#id")
    })
    @Transactional
    public ClubDTO rejectClub(Integer id, Integer reviewerId, String comment) {
        log.info("Rejecting club id: {} by reviewer: {}", id, reviewerId);
        Club club = clubRepository.findById(id)
                .orElseThrow(() -> new ClubNotFoundException(id));
        
        club.setStatus(com.englishflow.club.enums.ClubStatus.REJECTED);
        club.setReviewedBy(reviewerId);
        club.setReviewComment(comment);
        
        Club updatedClub = clubRepository.save(club);
        log.info("Club rejected: {}", id);
        return clubMapper.toDTO(updatedClub);
    }
    
    @Caching(evict = {
        @CacheEvict(value = "clubs", key = "'all'"),
        @CacheEvict(value = "clubById", key = "#id")
    })
    @Transactional
    public ClubDTO suspendClub(Integer id, Integer managerId, String reason) {
        log.info("Suspending club id: {} by manager: {}", id, managerId);
        Club club = clubRepository.findById(id)
                .orElseThrow(() -> new ClubNotFoundException(id));
        
        if (club.getStatus() != com.englishflow.club.enums.ClubStatus.APPROVED) {
            throw new IllegalStateException("Only approved clubs can be suspended");
        }
        
        club.setStatus(com.englishflow.club.enums.ClubStatus.SUSPENDED);
        club.setSuspendedBy(managerId);
        club.setSuspensionReason(reason);
        club.setSuspendedAt(java.time.LocalDateTime.now());
        
        Club updatedClub = clubRepository.save(club);
        log.info("Club suspended successfully: {}", id);
        return clubMapper.toDTO(updatedClub);
    }
    
    @Caching(evict = {
        @CacheEvict(value = "clubs", key = "'all'"),
        @CacheEvict(value = "clubById", key = "#id")
    })
    @Transactional
    public ClubDTO activateClub(Integer id, Integer managerId) {
        log.info("Activating club id: {} by manager: {}", id, managerId);
        Club club = clubRepository.findById(id)
                .orElseThrow(() -> new ClubNotFoundException(id));
        
        if (club.getStatus() != com.englishflow.club.enums.ClubStatus.SUSPENDED) {
            throw new IllegalStateException("Only suspended clubs can be activated");
        }
        
        club.setStatus(com.englishflow.club.enums.ClubStatus.APPROVED);
        club.setSuspendedBy(null);
        club.setSuspensionReason(null);
        club.setSuspendedAt(null);
        
        Club updatedClub = clubRepository.save(club);
        log.info("Club activated successfully: {}", id);
        return clubMapper.toDTO(updatedClub);
    }
}
