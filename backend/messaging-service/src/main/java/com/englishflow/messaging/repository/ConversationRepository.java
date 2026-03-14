package com.englishflow.messaging.repository;

import com.englishflow.messaging.model.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    
    @Query("SELECT DISTINCT c FROM Conversation c " +
           "LEFT JOIN FETCH c.participants " +
           "JOIN c.participants p " +
           "WHERE p.userId = :userId AND p.isActive = true " +
           "ORDER BY c.lastMessageAt DESC NULLS LAST, c.createdAt DESC")
    List<Conversation> findByUserId(@Param("userId") Long userId);
    
    @Query("SELECT c FROM Conversation c " +
           "JOIN FETCH c.participants p " +
           "WHERE c.id = :conversationId AND p.userId = :userId AND p.isActive = true")
    Optional<Conversation> findByIdAndUserId(@Param("conversationId") Long conversationId, 
                                              @Param("userId") Long userId);
    
    @Query("SELECT c FROM Conversation c " +
           "LEFT JOIN FETCH c.participants " +
           "WHERE c.id = :id")
    Optional<Conversation> findByIdWithParticipants(@Param("id") Long id);
    
    @Query("SELECT c FROM Conversation c " +
           "JOIN c.participants p1 " +
           "JOIN c.participants p2 " +
           "WHERE c.type = 'DIRECT' " +
           "AND p1.userId = :userId1 AND p1.isActive = true " +
           "AND p2.userId = :userId2 AND p2.isActive = true")
    Optional<Conversation> findDirectConversation(@Param("userId1") Long userId1, 
                                                   @Param("userId2") Long userId2);
}
