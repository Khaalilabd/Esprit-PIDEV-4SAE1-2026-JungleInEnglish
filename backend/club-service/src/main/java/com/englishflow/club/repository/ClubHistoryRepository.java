package com.englishflow.club.repository;

import com.englishflow.club.entity.ClubHistory;
import com.englishflow.club.enums.ClubHistoryType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ClubHistoryRepository extends JpaRepository<ClubHistory, Long> {
    
    // Trouver l'historique d'un club
    List<ClubHistory> findByClubIdOrderByCreatedAtDesc(Long clubId);
    
    // Trouver l'historique d'un utilisateur dans un club
    List<ClubHistory> findByClubIdAndUserIdOrderByCreatedAtDesc(Long clubId, Long userId);
    
    // Trouver l'historique d'un utilisateur (tous les clubs)
    List<ClubHistory> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    // Trouver l'historique par type
    List<ClubHistory> findByClubIdAndTypeOrderByCreatedAtDesc(Long clubId, ClubHistoryType type);
    
    // Trouver l'historique récent (derniers X jours)
    @Query("SELECT h FROM ClubHistory h WHERE h.clubId = :clubId AND h.createdAt >= :since ORDER BY h.createdAt DESC")
    List<ClubHistory> findRecentHistory(@Param("clubId") Long clubId, @Param("since") LocalDateTime since);
    
    // Trouver l'historique d'un utilisateur dans un club par type
    List<ClubHistory> findByClubIdAndUserIdAndTypeOrderByCreatedAtDesc(Long clubId, Long userId, ClubHistoryType type);
    
    // Compter les entrées d'historique pour un club
    long countByClubId(Long clubId);
    
    // Compter les entrées d'historique pour un utilisateur dans un club
    long countByClubIdAndUserId(Long clubId, Long userId);
}
