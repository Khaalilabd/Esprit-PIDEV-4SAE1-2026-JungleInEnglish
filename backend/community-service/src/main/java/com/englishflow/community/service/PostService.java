package com.englishflow.community.service;

import com.englishflow.community.dto.CreatePostRequest;
import com.englishflow.community.dto.PostDTO;
import com.englishflow.community.entity.Post;
import com.englishflow.community.entity.Topic;
import com.englishflow.community.exception.ResourceNotFoundException;
import com.englishflow.community.exception.TopicLockedException;
import com.englishflow.community.exception.UnauthorizedException;
import com.englishflow.community.repository.PostRepository;
import com.englishflow.community.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostService {
    
    private final PostRepository postRepository;
    private final TopicRepository topicRepository;
    
    @Transactional
    public PostDTO createPost(CreatePostRequest request) {
        Topic topic = topicRepository.findById(request.getTopicId())
                .orElseThrow(() -> new ResourceNotFoundException("Topic", request.getTopicId()));
        
        if (topic.getIsLocked()) {
            throw new TopicLockedException(request.getTopicId());
        }
        
        Post post = new Post();
        post.setContent(request.getContent());
        post.setUserId(request.getUserId());
        post.setUserName(request.getUserName());
        post.setTopic(topic);
        
        Post savedPost = postRepository.save(post);
        log.info("Created post {} for topic {} by user {}", savedPost.getId(), request.getTopicId(), request.getUserId());
        return convertToDTO(savedPost);
    }
    
    @Transactional
    public void deletePost(Long id, Long userId) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post", id));

        // Vérifier que l'utilisateur est le propriétaire
        if (!post.getUserId().equals(userId)) {
            throw new UnauthorizedException("You are not authorized to delete this post");
        }

        postRepository.delete(post);
        log.info("Deleted post {} by user {}", id, userId);
    }

    
    @Transactional(readOnly = true)
    public Page<PostDTO> getPostsByTopic(Long topicId, String sortBy, Pageable pageable) {
        Page<Post> posts;
        
        if ("helpful".equalsIgnoreCase(sortBy)) {
            posts = postRepository.findByTopicIdOrderByWeightedScore(topicId, pageable);
        } else if ("trending".equalsIgnoreCase(sortBy)) {
            // Trending: created in last 7 days with score >= 5
            LocalDateTime since = LocalDateTime.now().minusDays(7);
            posts = postRepository.findByTopicIdOrderByTrending(topicId, since, pageable);
        } else if ("recent".equalsIgnoreCase(sortBy)) {
            posts = postRepository.findByTopicIdOrderByRecent(topicId, pageable);
        } else {
            // Default: sort by accepted first, then weighted score
            posts = postRepository.findByTopicIdOrderByWeightedScore(topicId, pageable);
        }
        
        return posts.map(this::convertToDTO);
    }
    
    @Transactional
    public PostDTO updatePost(Long id, Long userId, CreatePostRequest request) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post", id));

        // Vérifier que l'utilisateur est le propriétaire
        if (!post.getUserId().equals(userId)) {
            throw new UnauthorizedException("You are not authorized to update this post");
        }

        post.setContent(request.getContent());

        Post updatedPost = postRepository.save(post);
        log.info("Updated post {} by user {}", id, userId);
        return convertToDTO(updatedPost);
    }

    
    private PostDTO convertToDTO(Post post) {
        PostDTO dto = new PostDTO();
        dto.setId(post.getId());
        dto.setContent(post.getContent());
        dto.setUserId(post.getUserId());
        dto.setUserName(post.getUserName());
        dto.setTopicId(post.getTopic().getId());
        dto.setReactionsCount(post.getReactionsCount());
        dto.setLikeCount(post.getLikeCount());
        dto.setInsightfulCount(post.getInsightfulCount());
        dto.setHelpfulCount(post.getHelpfulCount());
        dto.setWeightedScore(post.getWeightedScore());
        dto.setIsTrending(post.getIsTrending());
        dto.setIsAccepted(post.getIsAccepted());
        dto.setCreatedAt(post.getCreatedAt());
        dto.setUpdatedAt(post.getUpdatedAt());
        return dto;
    }
}
