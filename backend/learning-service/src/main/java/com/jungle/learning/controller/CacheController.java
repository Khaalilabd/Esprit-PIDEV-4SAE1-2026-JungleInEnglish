package com.jungle.learning.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.CacheManager;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/learning/cache")
@RequiredArgsConstructor
@Slf4j
public class CacheController {

    private final CacheManager cacheManager;

    @DeleteMapping("/clear")
    public ResponseEntity<String> clearAllCaches() {
        cacheManager.getCacheNames().forEach(cacheName -> {
            var cache = cacheManager.getCache(cacheName);
            if (cache != null) {
                cache.clear();
                log.info("Cleared cache: {}", cacheName);
            }
        });
        return ResponseEntity.ok("All caches cleared successfully");
    }

    @DeleteMapping("/clear/{cacheName}")
    public ResponseEntity<String> clearCache(@PathVariable String cacheName) {
        var cache = cacheManager.getCache(cacheName);
        if (cache != null) {
            cache.clear();
            log.info("Cleared cache: {}", cacheName);
            return ResponseEntity.ok("Cache '" + cacheName + "' cleared successfully");
        }
        return ResponseEntity.notFound().build();
    }
}
