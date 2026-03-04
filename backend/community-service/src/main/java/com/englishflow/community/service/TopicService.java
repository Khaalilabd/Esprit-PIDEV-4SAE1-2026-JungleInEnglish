package com.englishflow.community.service;

import com.englishflow.community.client.ClubServiceClient;
import com.englishflow.community.dto.CreateTopicRequest;
import com.englishflow.community.dto.MemberDTO;
import com.englishflow.community.dto.TopicDTO;
import com.englishflow.community.entity.SubCategory;
import com.englishflow.community.entity.Topic;
import com.englishflow.community.exception.ResourceNotFoundException;
import com.englishflow.community.exception.UnauthorizedException;
import com.englishflow.community.repository.SubCategoryRepository;
import com.englishflow.community.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TopicService {
    
    private final TopicRepository topicRepository;
    private final SubCategoryRepository subCategoryRepository;
    private final ClubServiceClient clubServiceClient;
    
    private static final List<String> ALLOWED_CLUB_ROLES = Arrays.asList(
        "PRESIDENT", "VICE_PRESIDENT", "SECRETARY", "TREASURER",
        "COMMUNICATION_MANAGER", "EVENT_MANAGER", "PARTNERSHIP_MANAGER", "MEMBER"
    );
    
    @Transactional
    public TopicDTO createTopic(CreateTopicRequest request) {
        SubCategory subCategory = subCategoryRepository.findById(request.getSubCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("SubCategory", request.getSubCategoryId()));
        
        // Check if category or subcategory is locked
        validateNotLocked(subCategory, request.getUserId());
        
        // Check if subcategory requires admin role (School Announcements)
        if (Boolean.TRUE.equals(subCategory.getRequiresAdminRole())) {
            validateAdminRole(request.getUserId());
        }
        
        // Check if subcategory requires club membership
        if (Boolean.TRUE.equals(subCategory.getRequiresClubMembership())) {
            validateClubMembership(request.getUserId());
        }
        
        Topic topic = new Topic();
        topic.setTitle(request.getTitle());
        topic.setContent(request.getContent());
        topic.setUserId(request.getUserId());
        topic.setUserName(request.getUserName());
        topic.setSubCategory(subCategory);
        topic.setResourceType(request.getResourceType());
        topic.setResourceLink(request.getResourceLink());
        topic.setViewsCount(0);
        topic.setIsPinned(false);
        topic.setIsLocked(false);
        
        Topic savedTopic = topicRepository.save(topic);
        log.info("Created topic {} in subcategory {} by user {}", savedTopic.getId(), request.getSubCategoryId(), request.getUserId());
        return convertToDTO(savedTopic);
    }
    
    private void validateNotLocked(SubCategory subCategory, Long userId) {
        // Check if subcategory is locked
        if (Boolean.TRUE.equals(subCategory.getIsLocked())) {
            // Only ACADEMIC_OFFICE_AFFAIRS can post in locked subcategories
            // TODO: Check user role via auth service
            log.warn("Attempt to post in locked subcategory {} by user {}", subCategory.getId(), userId);
            throw new UnauthorizedException("This subcategory is locked. Only Academic Office Affairs can post here.");
        }
        
        // Check if parent category is locked
        if (Boolean.TRUE.equals(subCategory.getCategory().getIsLocked())) {
            // Only ACADEMIC_OFFICE_AFFAIRS can post in locked categories
            log.warn("Attempt to post in locked category {} by user {}", subCategory.getCategory().getId(), userId);
            throw new UnauthorizedException("This category is locked. Only Academic Office Affairs can post here.");
        }
    }
    
    private void validateAdminRole(Long userId) {
        // This would typically call an auth service to check user role
        // For now, we'll throw an exception that the frontend can catch
        // In production, integrate with your auth service
        log.info("Validating admin role for user {}", userId);
        // TODO: Implement actual role check via auth service
    }
    
    private void validateClubMembership(Long userId) {
        try {
            List<MemberDTO> memberships = clubServiceClient.getUserMemberships(userId);
            
            if (memberships == null || memberships.isEmpty()) {
                log.warn("User {} is not a member of any club", userId);
                throw new UnauthorizedException("You must be a member of a club to post in Official Announcements");
            }
            
            boolean hasValidRole = memberships.stream()
                    .anyMatch(member -> ALLOWED_CLUB_ROLES.contains(member.getRank()));
            
            if (!hasValidRole) {
                log.warn("User {} does not have a valid club role", userId);
                throw new UnauthorizedException("You must have a club role to post in Official Announcements");
            }
            
            log.info("User {} validated as club member with role", userId);
        } catch (Exception e) {
            if (e instanceof UnauthorizedException) {
                throw e;
            }
            log.error("Error validating club membership for user {}: {}", userId, e.getMessage());
            throw new UnauthorizedException("Unable to verify club membership. Please try again later.");
        }
    }
    
    @Transactional(readOnly = true)
    public Page<TopicDTO> getTopicsBySubCategory(Long subCategoryId, String sortBy, Pageable pageable) {
        Page<Topic> topics;
        
        if ("helpful".equalsIgnoreCase(sortBy)) {
            topics = topicRepository.findBySubCategoryIdOrderByWeightedScore(subCategoryId, pageable);
        } else if ("trending".equalsIgnoreCase(sortBy)) {
            // Trending: created in last 7 days with score >= 5
            LocalDateTime since = LocalDateTime.now().minusDays(7);
            topics = topicRepository.findBySubCategoryIdOrderByTrending(subCategoryId, since, pageable);
        } else if ("recent".equalsIgnoreCase(sortBy)) {
            topics = topicRepository.findBySubCategoryIdOrderByRecent(subCategoryId, pageable);
        } else if ("views".equalsIgnoreCase(sortBy)) {
            topics = topicRepository.findBySubCategoryIdOrderByViews(subCategoryId, pageable);
        } else {
            // Default: pinned first, then by creation date
            topics = topicRepository.findBySubCategoryId(subCategoryId, pageable);
        }
        
        return topics.map(this::convertToDTO);
    }
    
    @Transactional
    public TopicDTO getTopicById(Long id, Long currentUserId) {
        Topic topic = topicRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Topic", id));
        
        // Increment view count only if viewer is not the author
        if (currentUserId == null || !currentUserId.equals(topic.getUserId())) {
            topic.setViewsCount(topic.getViewsCount() + 1);
            topicRepository.save(topic);
        }
        
        return convertToDTO(topic);
    }
    
    @Transactional
    public TopicDTO updateTopic(Long id, Long userId, CreateTopicRequest request) {
        Topic topic = topicRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Topic", id));

        // Vérifier que l'utilisateur est le propriétaire
        if (!topic.getUserId().equals(userId)) {
            throw new UnauthorizedException("You are not authorized to update this topic");
        }

        topic.setTitle(request.getTitle());
        topic.setContent(request.getContent());
        topic.setResourceType(request.getResourceType());
        topic.setResourceLink(request.getResourceLink());

        Topic updatedTopic = topicRepository.save(topic);
        log.info("Updated topic {} by user {}", id, userId);
        return convertToDTO(updatedTopic);
    }

    
    @Transactional
    public void deleteTopic(Long id, Long userId) {
        Topic topic = topicRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Topic", id));

        // Vérifier que l'utilisateur est le propriétaire
        if (!topic.getUserId().equals(userId)) {
            throw new UnauthorizedException("You are not authorized to delete this topic");
        }

        topicRepository.delete(topic);
        log.info("Deleted topic {} by user {}", id, userId);
    }

    
    @Transactional
    public TopicDTO pinTopic(Long id) {
        Topic topic = topicRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Topic", id));
        topic.setIsPinned(true);
        Topic updatedTopic = topicRepository.save(topic);
        log.info("Pinned topic {}", id);
        return convertToDTO(updatedTopic);
    }
    
    @Transactional
    public TopicDTO unpinTopic(Long id) {
        Topic topic = topicRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Topic", id));
        topic.setIsPinned(false);
        Topic updatedTopic = topicRepository.save(topic);
        log.info("Unpinned topic {}", id);
        return convertToDTO(updatedTopic);
    }
    
    @Transactional
    public TopicDTO lockTopic(Long id) {
        Topic topic = topicRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Topic", id));
        topic.setIsLocked(true);
        Topic updatedTopic = topicRepository.save(topic);
        log.info("Locked topic {}", id);
        return convertToDTO(updatedTopic);
    }
    
    @Transactional
    public TopicDTO unlockTopic(Long id) {
        Topic topic = topicRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Topic", id));
        topic.setIsLocked(false);
        Topic updatedTopic = topicRepository.save(topic);
        log.info("Unlocked topic {}", id);
        return convertToDTO(updatedTopic);
    }
    
    private TopicDTO convertToDTO(Topic topic) {
        TopicDTO dto = new TopicDTO();
        dto.setId(topic.getId());
        dto.setTitle(topic.getTitle());
        dto.setContent(topic.getContent());
        dto.setUserId(topic.getUserId());
        dto.setUserName(topic.getUserName());
        dto.setSubCategoryId(topic.getSubCategory().getId());
        dto.setViewsCount(topic.getViewsCount());
        dto.setReactionsCount(topic.getReactionsCount());
        dto.setLikeCount(topic.getLikeCount());
        dto.setInsightfulCount(topic.getInsightfulCount());
        dto.setHelpfulCount(topic.getHelpfulCount());
        dto.setWeightedScore(topic.getWeightedScore());
        dto.setIsTrending(topic.getIsTrending());
        dto.setIsPinned(topic.getIsPinned());
        dto.setIsLocked(topic.getIsLocked());
        dto.setPostsCount(topic.getPosts().size());
        dto.setCreatedAt(topic.getCreatedAt());
        dto.setUpdatedAt(topic.getUpdatedAt());
        dto.setResourceType(topic.getResourceType());
        dto.setResourceLink(topic.getResourceLink());
        return dto;
    }
    
    // Moderation methods
    @Transactional(readOnly = true)
    public Page<TopicDTO> getAllTopicsForModeration(Long categoryId, Long subCategoryId, String status, String search, Pageable pageable) {
        // Build specification for filtering
        Specification<Topic> spec = Specification.where(null);
        
        // Filter by subcategory (takes priority over category filter)
        if (subCategoryId != null) {
            spec = spec.and((root, query, cb) -> 
                cb.equal(root.get("subCategory").get("id"), subCategoryId)
            );
        }
        // Filter by category (includes all subcategories of the category)
        else if (categoryId != null) {
            spec = spec.and((root, query, cb) -> {
                // Get all subcategory IDs for this category
                List<Long> subCategoryIds = subCategoryRepository.findByCategoryId(categoryId)
                    .stream()
                    .map(SubCategory::getId)
                    .collect(Collectors.toList());
                
                if (subCategoryIds.isEmpty()) {
                    // If no subcategories, return no results
                    return cb.disjunction();
                }
                
                return root.get("subCategory").get("id").in(subCategoryIds);
            });
        }
        
        // Filter by status
        if (status != null && !status.isEmpty()) {
            switch (status.toLowerCase()) {
                case "pinned":
                    spec = spec.and((root, query, cb) -> cb.isTrue(root.get("isPinned")));
                    break;
                case "locked":
                    spec = spec.and((root, query, cb) -> cb.isTrue(root.get("isLocked")));
                    break;
                case "normal":
                    spec = spec.and((root, query, cb) -> 
                        cb.and(
                            cb.isFalse(root.get("isPinned")),
                            cb.isFalse(root.get("isLocked"))
                        )
                    );
                    break;
            }
        }
        
        // Filter by search query (title or content)
        if (search != null && !search.trim().isEmpty()) {
            String searchPattern = "%" + search.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> 
                cb.or(
                    cb.like(cb.lower(root.get("title")), searchPattern),
                    cb.like(cb.lower(cb.coalesce(root.get("content"), "")), searchPattern)
                )
            );
        }
        
        return topicRepository.findAll(spec, pageable).map(this::convertToDTO);
    }
    
    @Transactional
    public int bulkPinTopics(java.util.List<Long> topicIds) {
        int count = 0;
        for (Long id : topicIds) {
            try {
                Topic topic = topicRepository.findById(id).orElse(null);
                if (topic != null) {
                    topic.setIsPinned(true);
                    topicRepository.save(topic);
                    count++;
                }
            } catch (Exception e) {
                log.error("Error pinning topic {}: {}", id, e.getMessage());
            }
        }
        log.info("Bulk pinned {} topics", count);
        return count;
    }
    
    @Transactional
    public int bulkUnpinTopics(java.util.List<Long> topicIds) {
        int count = 0;
        for (Long id : topicIds) {
            try {
                Topic topic = topicRepository.findById(id).orElse(null);
                if (topic != null) {
                    topic.setIsPinned(false);
                    topicRepository.save(topic);
                    count++;
                }
            } catch (Exception e) {
                log.error("Error unpinning topic {}: {}", id, e.getMessage());
            }
        }
        log.info("Bulk unpinned {} topics", count);
        return count;
    }
    
    @Transactional
    public int bulkLockTopics(java.util.List<Long> topicIds) {
        int count = 0;
        for (Long id : topicIds) {
            try {
                Topic topic = topicRepository.findById(id).orElse(null);
                if (topic != null) {
                    topic.setIsLocked(true);
                    topicRepository.save(topic);
                    count++;
                }
            } catch (Exception e) {
                log.error("Error locking topic {}: {}", id, e.getMessage());
            }
        }
        log.info("Bulk locked {} topics", count);
        return count;
    }
    
    @Transactional
    public int bulkUnlockTopics(java.util.List<Long> topicIds) {
        int count = 0;
        for (Long id : topicIds) {
            try {
                Topic topic = topicRepository.findById(id).orElse(null);
                if (topic != null) {
                    topic.setIsLocked(false);
                    topicRepository.save(topic);
                    count++;
                }
            } catch (Exception e) {
                log.error("Error unlocking topic {}: {}", id, e.getMessage());
            }
        }
        log.info("Bulk unlocked {} topics", count);
        return count;
    }
    
    @Transactional
    public int bulkDeleteTopics(java.util.List<Long> topicIds, Long userId) {
        int count = 0;
        for (Long id : topicIds) {
            try {
                Topic topic = topicRepository.findById(id).orElse(null);
                if (topic != null) {
                    // For moderation, allow deletion without ownership check
                    // In production, add role check here
                    topicRepository.delete(topic);
                    count++;
                }
            } catch (Exception e) {
                log.error("Error deleting topic {}: {}", id, e.getMessage());
            }
        }
        log.info("Bulk deleted {} topics by user {}", count, userId);
        return count;
    }
    
    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getModerationStats() {
        long totalTopics = topicRepository.count();
        long pinnedTopics = topicRepository.countByIsPinned(true);
        long lockedTopics = topicRepository.countByIsLocked(true);
        
        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("totalTopics", totalTopics);
        stats.put("pinnedTopics", pinnedTopics);
        stats.put("lockedTopics", lockedTopics);
        stats.put("normalTopics", totalTopics - pinnedTopics - lockedTopics);
        
        return stats;
    }
}
