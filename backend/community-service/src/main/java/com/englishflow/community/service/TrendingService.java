package com.englishflow.community.service;

import com.englishflow.community.entity.Post;
import com.englishflow.community.entity.Topic;
import com.englishflow.community.repository.PostRepository;
import com.englishflow.community.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TrendingService {
    
    private final PostRepository postRepository;
    private final TopicRepository topicRepository;
    
    private static final int TRENDING_DAYS = 7;
    private static final int TOP_TRENDING_COUNT = 10;
    private static final int MIN_WEIGHTED_SCORE = 5;
    
    /**
     * Mark trending posts and topics every hour
     * Trending = created in last 7 days + weighted_score >= 5
     */
    @Scheduled(cron = "0 0 * * * *") // Every hour
    @Transactional
    public void updateTrendingStatus() {
        log.info("Starting trending status update...");
        
        LocalDateTime since = LocalDateTime.now().minusDays(TRENDING_DAYS);
        
        // ✅ OPTIMIZED: Reset all trending flags with bulk update
        int resetPostCount = postRepository.resetAllTrendingFlags();
        int resetTopicCount = topicRepository.resetAllTrendingFlags();
        log.debug("Reset trending flags: {} posts, {} topics", resetPostCount, resetTopicCount);
        
        // Mark trending posts
        List<Post> trendingPosts = postRepository.findTrendingPosts(since, PageRequest.of(0, TOP_TRENDING_COUNT));
        List<Long> trendingPostIds = trendingPosts.stream()
                .filter(post -> post.getWeightedScore() >= MIN_WEIGHTED_SCORE)
                .map(Post::getId)
                .collect(java.util.stream.Collectors.toList());
        
        int trendingPostCount = 0;
        if (!trendingPostIds.isEmpty()) {
            trendingPostCount = postRepository.markAsTrending(trendingPostIds);
        }
        
        // Mark trending topics
        List<Topic> trendingTopics = topicRepository.findTrendingTopics(since, PageRequest.of(0, TOP_TRENDING_COUNT));
        List<Long> trendingTopicIds = trendingTopics.stream()
                .filter(topic -> topic.getWeightedScore() >= MIN_WEIGHTED_SCORE)
                .map(Topic::getId)
                .collect(java.util.stream.Collectors.toList());
        
        int trendingTopicCount = 0;
        if (!trendingTopicIds.isEmpty()) {
            trendingTopicCount = topicRepository.markAsTrending(trendingTopicIds);
        }
        
        log.info("Trending status update completed: {} posts, {} topics marked as trending", 
                trendingPostCount, trendingTopicCount);
    }
    
    @Transactional
    private void resetAllTrendingFlags() {
        // This could be optimized with bulk update queries
        List<Post> allPosts = postRepository.findAll();
        for (Post post : allPosts) {
            if (Boolean.TRUE.equals(post.getIsTrending())) {
                post.setIsTrending(false);
            }
        }
        postRepository.saveAll(allPosts);
        
        List<Topic> allTopics = topicRepository.findAll();
        for (Topic topic : allTopics) {
            if (Boolean.TRUE.equals(topic.getIsTrending())) {
                topic.setIsTrending(false);
            }
        }
        topicRepository.saveAll(allTopics);
    }
}
