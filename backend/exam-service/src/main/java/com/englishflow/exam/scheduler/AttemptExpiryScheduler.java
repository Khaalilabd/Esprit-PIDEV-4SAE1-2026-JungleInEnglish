package com.englishflow.exam.scheduler;

import com.englishflow.exam.entity.StudentExamAttempt;
import com.englishflow.exam.enums.AttemptStatus;
import com.englishflow.exam.repository.StudentExamAttemptRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class AttemptExpiryScheduler {
    
    private final StudentExamAttemptRepository attemptRepository;
    
    /**
     * Runs every 5 minutes to check for expired attempts
     */
    @Scheduled(fixedRate = 300000) // 5 minutes in milliseconds
    @Transactional
    public void expireTimedOutAttempts() {
        log.info("Running attempt expiry check...");
        
        List<StudentExamAttempt> startedAttempts = attemptRepository.findByStatus(AttemptStatus.STARTED);
        int expiredCount = 0;
        
        for (StudentExamAttempt attempt : startedAttempts) {
            LocalDateTime expiryTime = attempt.getStartedAt()
                    .plusMinutes(attempt.getExam().getTotalDuration());
            
            if (LocalDateTime.now().isAfter(expiryTime)) {
                attempt.setStatus(AttemptStatus.EXPIRED);
                attemptRepository.save(attempt);
                expiredCount++;
                log.info("Expired attempt: {} for user: {}", attempt.getId(), attempt.getUserId());
            }
        }
        
        if (expiredCount > 0) {
            log.info("Expired {} attempt(s)", expiredCount);
        } else {
            log.debug("No attempts expired");
        }
    }
}
