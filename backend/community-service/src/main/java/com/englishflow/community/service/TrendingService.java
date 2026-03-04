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
        
        // Reset all trending flags
        resetAllTrendingFlags();
        
        // Mark trending posts
        List<Post> trendingPosts = postRepository.findTrendingPosts(since, PageRequest.of(0, TOP_TRENDING_COUNT));
        int trendingPostCount = 0;
        for (Post post : trendingPosts) {
            if (post.getWeightedScore() >= MIN_WEIGHTED_SCORE) {
                post.setIsTrending(true);
                postRepository.save(post);
                trendingPostCount++;
            }
        }
        
        // Mark trending topics
        List<Topic> trendingTopics = topicRepository.findTrendingTopics(since, PageRequest.of(0, TOP_TRENDING_COUNT));
        int trendingTopicCount = 0;
        for (Topic topic : trendingTopics) {
            if (topic.getWeightedScore() >= MIN_WEIGHTED_SCORE) {
                topic.setIsTrending(true);
                topicRepository.save(topic);
                trendingTopicCount++;
            }
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
