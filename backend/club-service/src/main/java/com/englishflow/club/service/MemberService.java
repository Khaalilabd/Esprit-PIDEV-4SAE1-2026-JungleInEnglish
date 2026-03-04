package com.englishflow.club.service;

import com.englishflow.club.dto.MemberDTO;
import com.englishflow.club.entity.Club;
import com.englishflow.club.entity.Member;
import com.englishflow.club.enums.RankType;
import com.englishflow.club.exception.*;
import com.englishflow.club.mapper.MemberMapper;
import com.englishflow.club.repository.ClubRepository;
import com.englishflow.club.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MemberService {
    
    private final MemberRepository memberRepository;
    private final ClubRepository clubRepository;
    private final MemberMapper memberMapper;
    private final ClubHistoryService clubHistoryService;
    
    @Cacheable(value = "members", key = "'club-' + #clubId")
    @Transactional(readOnly = true)
    public List<MemberDTO> getMembersByClub(Integer clubId) {
        log.debug("Fetching members for club: {}", clubId);
        return memberRepository.findByClubId(clubId).stream()
                .map(memberMapper::toDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<MemberDTO> getMembersByUser(Long userId) {
        log.debug("Fetching memberships for user: {}", userId);
        try {
            List<Member> members = memberRepository.findByUserId(userId);
            return members.stream()
                    .map(memberMapper::toDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching members for user {}: {}", userId, e.getMessage(), e);
            throw new RuntimeException("Error fetching members for user " + userId + ": " + e.getMessage(), e);
        }
    }
    
    @CacheEvict(value = "members", key = "'club-' + #clubId")
    @Transactional
    public MemberDTO addMemberToClub(Integer clubId, Long userId) {
        log.info("Adding user {} to club {}", userId, clubId);
        
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new ClubNotFoundException(clubId));
        
        if (club.isFull()) {
            log.warn("Club {} is full. Cannot add user {}", clubId, userId);
            throw new ClubFullException(club.getMaxMembers());
        }
        
        if (memberRepository.existsByClubIdAndUserId(clubId, userId)) {
            log.warn("User {} is already a member of club {}", userId, clubId);
            throw new DuplicateMemberException("User is already a member of this club");
        }
        
        Member member = Member.builder()
                .club(club)
                .userId(userId)
                .rank(RankType.MEMBER)
                .build();
        
        Member savedMember = memberRepository.save(member);
        log.info("User {} successfully added to club {}", userId, clubId);
        return memberMapper.toDTO(savedMember);
    }
    
    @CacheEvict(value = "members", key = "'club-' + #clubId")
    @Transactional
    public MemberDTO addPresidentToClub(Integer clubId, Long userId) {
        log.info("Adding user {} as president to club {}", userId, clubId);
        
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new ClubNotFoundException(clubId));
        
        if (memberRepository.existsByClubIdAndUserId(clubId, userId)) {
            log.warn("User {} is already a member of club {}", userId, clubId);
            throw new DuplicateMemberException("User is already a member of this club");
        }
        
        Member member = Member.builder()
                .club(club)
                .userId(userId)
                .rank(RankType.PRESIDENT)
                .build();
        
        Member savedMember = memberRepository.save(member);
        log.info("User {} successfully added as president to club {}", userId, clubId);
        return memberMapper.toDTO(savedMember);
    }
    
    @CacheEvict(value = "members", allEntries = true)
    @Transactional
    public MemberDTO updateMemberRank(Integer memberId, RankType newRank, Long requesterId) {
        log.info("Updating rank for member {} to {} by user {}", memberId, newRank, requesterId);
        
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new MemberNotFoundException(memberId));
        
        if (!isPresident(member.getClub().getId(), requesterId)) {
            log.warn("Unauthorized rank update attempt by user {} on member {}", requesterId, memberId);
            throw new UnauthorizedException("Only the president can change member ranks");
        }
        
        // Prevent changing the rank if this is the only president
        if (member.getRank() == RankType.PRESIDENT && newRank != RankType.PRESIDENT) {
            long presidentCount = memberRepository.findByClubIdAndRank(member.getClub().getId(), RankType.PRESIDENT).size();
            if (presidentCount <= 1) {
                log.warn("Cannot remove last president from club {}", member.getClub().getId());
                throw new UnauthorizedException("Cannot change the rank of the last president. Assign another president first.");
            }
        }
        
        // Save old rank for history
        RankType oldRank = member.getRank();
        
        // Update rank
        member.setRank(newRank);
        Member updatedMember = memberRepository.save(member);
        
        // Create history entry
        try {
            clubHistoryService.logHistory(
                member.getClub().getId().longValue(),
                member.getUserId(),
                com.englishflow.club.enums.ClubHistoryType.RANK_CHANGED,
                "Member role changed",
                String.format("Role changed from %s to %s", oldRank, newRank),
                oldRank.toString(),
                newRank.toString(),
                requesterId
            );
            log.info("History entry created for rank change");
        } catch (Exception e) {
            log.error("Failed to create history entry for rank change: {}", e.getMessage(), e);
            // Don't fail the whole operation if history creation fails
        }
        
        log.info("Member {} rank updated successfully to {}", memberId, newRank);
        return memberMapper.toDTO(updatedMember);
    }
    
    @Transactional(readOnly = true)
    public boolean isPresident(Integer clubId, Long userId) {
        return memberRepository.findByClubIdAndUserId(clubId, userId)
                .map(member -> member.getRank() == RankType.PRESIDENT)
                .orElse(false);
    }
    
    @Transactional(readOnly = true)
    public boolean isMember(Integer clubId, Long userId) {
        return memberRepository.existsByClubIdAndUserId(clubId, userId);
    }
    
    @CacheEvict(value = "members", key = "'club-' + #member.club.id")
    @Transactional
    public void removeMemberFromClub(Integer memberId, Long requesterId) {
        log.info("Removing member {} by user {}", memberId, requesterId);
        
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new MemberNotFoundException(memberId));
        
        if (!isPresident(member.getClub().getId(), requesterId)) {
            log.warn("Unauthorized member removal attempt by user {}", requesterId);
            throw new UnauthorizedException("Only the president can remove members");
        }
        
        if (member.getRank() == RankType.PRESIDENT) {
            log.warn("Attempt to remove president from club {}", member.getClub().getId());
            throw new UnauthorizedException("Cannot remove the president from the club");
        }
        
        memberRepository.deleteById(memberId);
        log.info("Member {} removed successfully", memberId);
    }
    
    @CacheEvict(value = "members", key = "'club-' + #clubId")
    @Transactional
    public void removeMemberByUserAndClub(Integer clubId, Long userId) {
        log.info("Removing user {} from club {}", userId, clubId);
        Member member = memberRepository.findByClubIdAndUserId(clubId, userId)
                .orElseThrow(() -> new MemberNotFoundException("Member not found"));
        memberRepository.delete(member);
        log.info("User {} removed from club {}", userId, clubId);
    }
    
    @Transactional(readOnly = true)
    public long getClubMemberCount(Integer clubId) {
        return memberRepository.countByClubId(clubId);
    }

    @Transactional(readOnly = true)
    public List<com.englishflow.club.dto.ClubWithRoleDTO> getUserClubsWithStatus(Long userId) {
        log.debug("Fetching clubs with status for user: {}", userId);
        List<Member> members = memberRepository.findByUserId(userId);
        return members.stream()
                .map(member -> {
                    Club club = member.getClub();
                    return com.englishflow.club.dto.ClubWithRoleDTO.builder()
                            .id(club.getId())
                            .name(club.getName())
                            .description(club.getDescription())
                            .objective(club.getObjective())
                            .category(club.getCategory())
                            .maxMembers(club.getMaxMembers())
                            .image(club.getImage())
                            .status(club.getStatus())
                            .createdBy(club.getCreatedBy())
                            .reviewedBy(club.getReviewedBy())
                            .reviewComment(club.getReviewComment())
                            .createdAt(club.getCreatedAt())
                            .updatedAt(club.getUpdatedAt())
                            .userRole(member.getRank())
                            .joinedAt(member.getJoinedAt())
                            .build();
                })
                .collect(Collectors.toList());
    }
}
