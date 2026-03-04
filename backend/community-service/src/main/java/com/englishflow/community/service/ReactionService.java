package com.englishflow.community.service;

import com.englishflow.community.dto.ReactionDTO;
import com.englishflow.community.entity.Post;
import com.englishflow.community.entity.Reaction;
import com.englishflow.community.entity.Topic;
import com.englishflow.community.exception.ResourceNotFoundException;
import com.englishflow.community.repository.PostRepository;
import com.englishflow.community.repository.ReactionRepository;
import com.englishflow.community.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReactionService {
    
    private final ReactionRepository reactionRepository;
    private final PostRepository postRepository;
    private final TopicRepository topicRepository;
    
    @Transactional
    public ReactionDTO addReactionToPost(Long postId, Long userId, Reaction.ReactionType type) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post", postId));
        
        Optional<Reaction> existing = reactionRepository.findByUserIdAndPostId(userId, postId);
        if (existing.isPresent()) {
            Reaction reaction = existing.get();
            Reaction.ReactionType oldType = reaction.getType();
            reaction.setType(type);
            Reaction updated = reactionRepository.save(reaction);
            
            // Update reaction counts using direct queries
            Long likeCount = reactionRepository.countByPostIdAndType(postId, Reaction.ReactionType.LIKE);
            Long insightfulCount = reactionRepository.countByPostIdAndType(postId, Reaction.ReactionType.INSIGHTFUL);
            Long helpfulCount = reactionRepository.countByPostIdAndType(postId, Reaction.ReactionType.HELPFUL);
            
            post.setLikeCount(likeCount.intValue());
            post.setInsightfulCount(insightfulCount.intValue());
            post.setHelpfulCount(helpfulCount.intValue());
            post.setReactionsCount(likeCount.intValue() + insightfulCount.intValue() + helpfulCount.intValue());
            post.calculateWeightedScore();
            
            postRepository.save(post);
            
            log.info("Updated reaction for user {} on post {} from {} to {}", userId, postId, oldType, type);
            return convertToDTO(updated);
        }
        
        Reaction reaction = new Reaction();
        reaction.setUserId(userId);
        reaction.setPost(post);
        reaction.setType(type);
        
        Reaction saved = reactionRepository.save(reaction);
        
        // Update reaction counts using direct queries
        Long likeCount = reactionRepository.countByPostIdAndType(postId, Reaction.ReactionType.LIKE);
        Long insightfulCount = reactionRepository.countByPostIdAndType(postId, Reaction.ReactionType.INSIGHTFUL);
        Long helpfulCount = reactionRepository.countByPostIdAndType(postId, Reaction.ReactionType.HELPFUL);
        
        post.setLikeCount(likeCount.intValue());
        post.setInsightfulCount(insightfulCount.intValue());
        post.setHelpfulCount(helpfulCount.intValue());
        post.setReactionsCount(likeCount.intValue() + insightfulCount.intValue() + helpfulCount.intValue());
        post.calculateWeightedScore();
        
        postRepository.save(post);
        
        log.info("Added {} reaction for user {} on post {}", type, userId, postId);
        return convertToDTO(saved);
    }
    
    @Transactional
    public ReactionDTO addReactionToTopic(Long topicId, Long userId, Reaction.ReactionType type) {
        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new ResourceNotFoundException("Topic", topicId));
        
        Optional<Reaction> existing = reactionRepository.findByUserIdAndTopicId(userId, topicId);
        if (existing.isPresent()) {
            Reaction reaction = existing.get();
            Reaction.ReactionType oldType = reaction.getType();
            reaction.setType(type);
            Reaction updated = reactionRepository.save(reaction);
            
            // Update reaction counts using direct queries
            Long likeCount = reactionRepository.countByTopicIdAndType(topicId, Reaction.ReactionType.LIKE);
            Long insightfulCount = reactionRepository.countByTopicIdAndType(topicId, Reaction.ReactionType.INSIGHTFUL);
            Long helpfulCount = reactionRepository.countByTopicIdAndType(topicId, Reaction.ReactionType.HELPFUL);
            
            topic.setLikeCount(likeCount.intValue());
            topic.setInsightfulCount(insightfulCount.intValue());
            topic.setHelpfulCount(helpfulCount.intValue());
            topic.setReactionsCount(likeCount.intValue() + insightfulCount.intValue() + helpfulCount.intValue());
            topic.calculateWeightedScore();
            
            topicRepository.save(topic);
            
            log.info("Updated reaction for user {} on topic {} from {} to {}", userId, topicId, oldType, type);
            return convertToDTO(updated);
        }
        
        Reaction reaction = new Reaction();
        reaction.setUserId(userId);
        reaction.setTopic(topic);
        reaction.setType(type);
        
        Reaction saved = reactionRepository.save(reaction);
        
        // Update reaction counts using direct queries
        Long likeCount = reactionRepository.countByTopicIdAndType(topicId, Reaction.ReactionType.LIKE);
        Long insightfulCount = reactionRepository.countByTopicIdAndType(topicId, Reaction.ReactionType.INSIGHTFUL);
        Long helpfulCount = reactionRepository.countByTopicIdAndType(topicId, Reaction.ReactionType.HELPFUL);
        
        topic.setLikeCount(likeCount.intValue());
        topic.setInsightfulCount(insightfulCount.intValue());
        topic.setHelpfulCount(helpfulCount.intValue());
        topic.setReactionsCount(likeCount.intValue() + insightfulCount.intValue() + helpfulCount.intValue());
        topic.calculateWeightedScore();
        
        topicRepository.save(topic);
        
        log.info("Added {} reaction for user {} on topic {}", type, userId, topicId);
        return convertToDTO(saved);
    }
    
    @Transactional
    public void removeReactionFromPost(Long postId, Long userId) {
        Optional<Reaction> reactionOpt = reactionRepository.findByUserIdAndPostId(userId, postId);
        
        if (reactionOpt.isEmpty()) {
            log.warn("No reaction found for user {} on post {}", userId, postId);
            return; // Silently return if no reaction exists
        }
        
        Reaction reaction = reactionOpt.get();
        Post post = reaction.getPost();
        
        // Delete the reaction
        reactionRepository.delete(reaction);
        reactionRepository.flush(); // Force immediate deletion
        
        // Update reaction counts using direct queries
        Long likeCount = reactionRepository.countByPostIdAndType(postId, Reaction.ReactionType.LIKE);
        Long insightfulCount = reactionRepository.countByPostIdAndType(postId, Reaction.ReactionType.INSIGHTFUL);
        Long helpfulCount = reactionRepository.countByPostIdAndType(postId, Reaction.ReactionType.HELPFUL);
        
        post.setLikeCount(likeCount.intValue());
        post.setInsightfulCount(insightfulCount.intValue());
        post.setHelpfulCount(helpfulCount.intValue());
        post.setReactionsCount(likeCount.intValue() + insightfulCount.intValue() + helpfulCount.intValue());
        post.calculateWeightedScore();
        
        postRepository.save(post);
        postRepository.flush(); // Force immediate save
        
        log.info("Removed reaction for user {} from post {}", userId, postId);
    }
    
    @Transactional
    public void removeReactionFromTopic(Long topicId, Long userId) {
        Optional<Reaction> reactionOpt = reactionRepository.findByUserIdAndTopicId(userId, topicId);
        
        if (reactionOpt.isEmpty()) {
            log.warn("No reaction found for user {} on topic {}", userId, topicId);
            return; // Silently return if no reaction exists
        }
        
        Reaction reaction = reactionOpt.get();
        Topic topic = reaction.getTopic();
        
        // Delete the reaction
        reactionRepository.delete(reaction);
        reactionRepository.flush(); // Force immediate deletion
        
        // Update reaction counts using direct queries
        Long likeCount = reactionRepository.countByTopicIdAndType(topicId, Reaction.ReactionType.LIKE);
        Long insightfulCount = reactionRepository.countByTopicIdAndType(topicId, Reaction.ReactionType.INSIGHTFUL);
        Long helpfulCount = reactionRepository.countByTopicIdAndType(topicId, Reaction.ReactionType.HELPFUL);
        
        topic.setLikeCount(likeCount.intValue());
        topic.setInsightfulCount(insightfulCount.intValue());
        topic.setHelpfulCount(helpfulCount.intValue());
        topic.setReactionsCount(likeCount.intValue() + insightfulCount.intValue() + helpfulCount.intValue());
        topic.calculateWeightedScore();
        
        topicRepository.save(topic);
        topicRepository.flush(); // Force immediate save
        
        log.info("Removed reaction for user {} from topic {}", userId, topicId);
    }
    
    @Transactional(readOnly = true)
    public Long getPostReactionsCount(Long postId) {
        return reactionRepository.countByPostId(postId);
    }
    
    @Transactional(readOnly = true)
    public Long getTopicReactionsCount(Long topicId) {
        return reactionRepository.countByTopicId(topicId);
    }
    
    @Transactional(readOnly = true)
    public java.util.List<com.englishflow.community.dto.ReactionCountDTO> getPostReactionsByType(Long postId) {
        java.util.List<com.englishflow.community.dto.ReactionCountDTO> counts = new java.util.ArrayList<>();
        
        for (Reaction.ReactionType type : Reaction.ReactionType.values()) {
            Long count = reactionRepository.countByPostIdAndType(postId, type);
            if (count > 0) {
                counts.add(new com.englishflow.community.dto.ReactionCountDTO(type, count));
            }
        }
        
        return counts;
    }
    
    @Transactional(readOnly = true)
    public java.util.List<com.englishflow.community.dto.ReactionCountDTO> getTopicReactionsByType(Long topicId) {
        java.util.List<com.englishflow.community.dto.ReactionCountDTO> counts = new java.util.ArrayList<>();
        
        for (Reaction.ReactionType type : Reaction.ReactionType.values()) {
            Long count = reactionRepository.countByTopicIdAndType(topicId, type);
            if (count > 0) {
                counts.add(new com.englishflow.community.dto.ReactionCountDTO(type, count));
            }
        }
        
        return counts;
    }
    
    @Transactional(readOnly = true)
    public Optional<ReactionDTO> getUserReactionForPost(Long postId, Long userId) {
        return reactionRepository.findByUserIdAndPostId(userId, postId)
                .map(this::convertToDTO);
    }
    
    @Transactional(readOnly = true)
    public Optional<ReactionDTO> getUserReactionForTopic(Long topicId, Long userId) {
        return reactionRepository.findByUserIdAndTopicId(userId, topicId)
                .map(this::convertToDTO);
    }
    
    @Transactional
    public void recalculateAllScores() {
        log.info("Starting recalculation of all weighted scores...");
        
        // Recalculate for all topics using direct queries
        java.util.List<Topic> topics = topicRepository.findAll();
        for (Topic topic : topics) {
            // Count reactions by type
            Long likeCount = reactionRepository.countByTopicIdAndType(topic.getId(), Reaction.ReactionType.LIKE);
            Long insightfulCount = reactionRepository.countByTopicIdAndType(topic.getId(), Reaction.ReactionType.INSIGHTFUL);
            Long helpfulCount = reactionRepository.countByTopicIdAndType(topic.getId(), Reaction.ReactionType.HELPFUL);
            
            // Update counts
            topic.setLikeCount(likeCount.intValue());
            topic.setInsightfulCount(insightfulCount.intValue());
            topic.setHelpfulCount(helpfulCount.intValue());
            topic.setReactionsCount(likeCount.intValue() + insightfulCount.intValue() + helpfulCount.intValue());
            
            // Calculate weighted score
            topic.calculateWeightedScore();
        }
        topicRepository.saveAll(topics);
        log.info("Recalculated scores for {} topics", topics.size());
        
        // Recalculate for all posts using direct queries
        java.util.List<Post> posts = postRepository.findAll();
        for (Post post : posts) {
            // Count reactions by type
            Long likeCount = reactionRepository.countByPostIdAndType(post.getId(), Reaction.ReactionType.LIKE);
            Long insightfulCount = reactionRepository.countByPostIdAndType(post.getId(), Reaction.ReactionType.INSIGHTFUL);
            Long helpfulCount = reactionRepository.countByPostIdAndType(post.getId(), Reaction.ReactionType.HELPFUL);
            
            // Update counts
            post.setLikeCount(likeCount.intValue());
            post.setInsightfulCount(insightfulCount.intValue());
            post.setHelpfulCount(helpfulCount.intValue());
            post.setReactionsCount(likeCount.intValue() + insightfulCount.intValue() + helpfulCount.intValue());
            
            // Calculate weighted score
            post.calculateWeightedScore();
        }
        postRepository.saveAll(posts);
        log.info("Recalculated scores for {} posts", posts.size());
        
        log.info("Finished recalculation of all weighted scores");
    }
    
    private ReactionDTO convertToDTO(Reaction reaction) {
        ReactionDTO dto = new ReactionDTO();
        dto.setId(reaction.getId());
        dto.setUserId(reaction.getUserId());
        dto.setType(reaction.getType());
        if (reaction.getPost() != null) {
            dto.setPostId(reaction.getPost().getId());
        }
        if (reaction.getTopic() != null) {
            dto.setTopicId(reaction.getTopic().getId());
        }
        return dto;
    }
}
