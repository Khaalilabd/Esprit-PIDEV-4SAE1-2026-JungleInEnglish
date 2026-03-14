package com.englishflow.messaging.service;

import com.englishflow.messaging.client.AuthServiceClient;
import com.englishflow.messaging.constants.MessagingConstants;
import com.englishflow.messaging.dto.*;
import com.englishflow.messaging.exception.ConversationNotFoundException;
import com.englishflow.messaging.exception.MessageValidationException;
import com.englishflow.messaging.exception.UnauthorizedAccessException;
import com.englishflow.messaging.model.*;
import com.englishflow.messaging.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessagingService {
    
    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final MessageRepository messageRepository;
    private final MessageReadStatusRepository readStatusRepository;
    private final AuthServiceClient authServiceClient;
    private final MessageReactionService reactionService;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserPresenceService userPresenceService;
    
    @Transactional(readOnly = true)
    public List<ConversationDTO> getUserConversations(Long userId) {
        log.debug("Getting conversations for user: {}", userId);
        List<Conversation> conversations = conversationRepository.findByUserId(userId);
        
        return conversations.stream()
            .map(conv -> convertToDTO(conv, userId))
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public ConversationDTO getConversation(Long conversationId, Long userId) {
        log.debug("Getting conversation {} for user {}", conversationId, userId);
        
        // Vérifier que l'utilisateur est participant (SÉCURITÉ)
        if (!participantRepository.existsByConversationIdAndUserId(conversationId, userId)) {
            throw new UnauthorizedAccessException(conversationId, userId);
        }
        
        // Charger la conversation avec TOUS les participants (pas seulement l'utilisateur actuel)
        Conversation conversation = conversationRepository.findByIdWithParticipants(conversationId)
            .orElseThrow(() -> new ConversationNotFoundException(conversationId));
        
        return convertToDTO(conversation, userId);
    }
    
    @Transactional
    public ConversationDTO createConversation(CreateConversationRequest request, Long currentUserId, 
                                              String currentUserName, String currentUserEmail, 
                                              String currentUserRole, String currentUserAvatar) {
        log.debug("Creating conversation for user: {}", currentUserId);
        
        // Vérifier si c'est une conversation directe et si elle existe déjà
        if (request.getType() == Conversation.ConversationType.DIRECT && request.getParticipantIds().size() == 1) {
            Long otherUserId = request.getParticipantIds().get(0);
            var existing = conversationRepository.findDirectConversation(currentUserId, otherUserId);
            if (existing.isPresent()) {
                return convertToDTO(existing.get(), currentUserId);
            }
        }
        
        Conversation conversation = new Conversation();
        conversation.setType(request.getType());
        conversation.setTitle(request.getTitle());
        conversation.setDescription(request.getDescription());
        conversation.setGroupPhoto(request.getGroupPhoto());
        conversation.setCreatedBy(currentUserId);
        conversation.setCreatedAt(LocalDateTime.now());
        conversation.setUpdatedAt(LocalDateTime.now());
        
        conversation = conversationRepository.save(conversation);
        
        // Ajouter l'utilisateur actuel comme participant (ADMIN pour les groupes)
        ConversationParticipant.ParticipantRole role = request.getType() == Conversation.ConversationType.GROUP 
            ? ConversationParticipant.ParticipantRole.ADMIN 
            : ConversationParticipant.ParticipantRole.MEMBER;
        addParticipantWithRole(conversation, currentUserId, currentUserName, currentUserEmail, 
                      currentUserRole, currentUserAvatar, role);
        
        // Ajouter les autres participants
        for (Long participantId : request.getParticipantIds()) {
            if (!participantId.equals(currentUserId)) {
                // Récupérer les infos utilisateur depuis auth-service
                AuthServiceClient.UserInfo userInfo = authServiceClient.getUserInfo(participantId);
                addParticipantWithRole(conversation, participantId, userInfo.getFullName(), 
                             userInfo.getEmail(), userInfo.getRole(), userInfo.getProfilePhotoUrl(), 
                             ConversationParticipant.ParticipantRole.MEMBER);
            }
        }
        
        // Recharger la conversation avec les participants pour éviter LazyInitializationException
        conversation = conversationRepository.findByIdWithParticipants(conversation.getId())
            .orElseThrow(() -> new ConversationNotFoundException("Conversation not found after creation"));
        
        return convertToDTO(conversation, currentUserId);
    }
    
    private void addParticipant(Conversation conversation, Long userId, String userName, 
                               String userEmail, String userRole, String userAvatar) {
        addParticipantWithRole(conversation, userId, userName, userEmail, userRole, userAvatar, 
                             ConversationParticipant.ParticipantRole.MEMBER);
    }
    
    private void addParticipantWithRole(Conversation conversation, Long userId, String userName, 
                               String userEmail, String userRole, String userAvatar, 
                               ConversationParticipant.ParticipantRole participantRole) {
        ConversationParticipant participant = new ConversationParticipant();
        participant.setConversation(conversation);
        participant.setUserId(userId);
        participant.setUserName(userName);
        participant.setUserEmail(userEmail);
        participant.setUserRole(userRole);
        participant.setUserAvatar(userAvatar);
        participant.setIsActive(true);
        participant.setParticipantRole(participantRole);
        participant.setJoinedAt(LocalDateTime.now());
        
        participantRepository.save(participant);
    }
    
    @Transactional(readOnly = true)
    public Page<MessageDTO> getMessages(Long conversationId, Long userId, int page, int size) {
        log.debug("Getting messages for conversation {} (page: {}, size: {})", conversationId, page, size);
        
        // Vérifier que l'utilisateur est participant
        if (!participantRepository.existsByConversationIdAndUserId(conversationId, userId)) {
            throw new UnauthorizedAccessException(conversationId, userId);
        }
        
        // Valider et limiter la taille de la page
        if (size > MessagingConstants.MAX_PAGE_SIZE) {
            size = MessagingConstants.MAX_PAGE_SIZE;
        }
        if (size < MessagingConstants.MIN_PAGE_SIZE) {
            size = MessagingConstants.DEFAULT_PAGE_SIZE;
        }
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Message> messages = messageRepository.findMessagesByConversationId(conversationId, pageable);
        
        return messages.map(this::convertToMessageDTO);
    }
    
    @Transactional
    public MessageDTO sendMessage(Long conversationId, SendMessageRequest request, Long senderId, 
                                  String senderName, String senderAvatar) {
        log.debug("Sending message to conversation {} from user {}", conversationId, senderId);
        
        // Validation du contenu selon le type de message
        if (request.getMessageType() == Message.MessageType.EMOJI) {
            // Pour les emojis, le contenu peut être vide mais l'emojiCode doit être présent
            if (request.getEmojiCode() == null || request.getEmojiCode().trim().isEmpty()) {
                throw new MessageValidationException("Emoji code is required for EMOJI message type");
            }
            // Valider le format du code emoji (ex: U+1F600 ou emoji natif)
            if (request.getEmojiCode().length() > 50) {
                throw new MessageValidationException("Emoji code is too long");
            }
        } else if (request.getMessageType() == Message.MessageType.FILE) {
            // Pour les fichiers, le contenu est optionnel (légende) mais fileUrl est obligatoire
            if (request.getFileUrl() == null || request.getFileUrl().trim().isEmpty()) {
                throw new MessageValidationException("File URL is required for FILE message type");
            }
            if (request.getFileName() == null || request.getFileName().trim().isEmpty()) {
                throw new MessageValidationException("File name is required for FILE message type");
            }
            // Le contenu (légende) est optionnel pour les fichiers
            if (request.getContent() != null && request.getContent().length() > MessagingConstants.MAX_MESSAGE_LENGTH) {
                throw new MessageValidationException(MessagingConstants.ERROR_MESSAGE_TOO_LONG);
            }
        } else if (request.getMessageType() == Message.MessageType.VOICE) {
            // Pour les messages vocaux, le contenu est optionnel mais fileUrl et voiceDuration sont obligatoires
            if (request.getFileUrl() == null || request.getFileUrl().trim().isEmpty()) {
                throw new MessageValidationException("File URL is required for VOICE message type");
            }
            if (request.getVoiceDuration() == null || request.getVoiceDuration() <= 0) {
                throw new MessageValidationException("Voice duration is required for VOICE message type");
            }
            // Le contenu est optionnel pour les messages vocaux
            if (request.getContent() != null && request.getContent().length() > MessagingConstants.MAX_MESSAGE_LENGTH) {
                throw new MessageValidationException(MessagingConstants.ERROR_MESSAGE_TOO_LONG);
            }
        } else {
            // Pour les messages texte, le contenu est obligatoire
            if (request.getContent() == null || request.getContent().trim().isEmpty()) {
                throw new MessageValidationException(MessagingConstants.ERROR_MESSAGE_EMPTY);
            }
            if (request.getContent().length() > MessagingConstants.MAX_MESSAGE_LENGTH) {
                throw new MessageValidationException(MessagingConstants.ERROR_MESSAGE_TOO_LONG);
            }
        }
        
        Conversation conversation = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new ConversationNotFoundException(conversationId));
        
        // Vérifier que l'utilisateur est participant (SÉCURITÉ CRITIQUE)
        if (!participantRepository.existsByConversationIdAndUserId(conversationId, senderId)) {
            throw new UnauthorizedAccessException(conversationId, senderId);
        }
        
        Message message = new Message();
        message.setConversation(conversation);
        message.setSenderId(senderId);
        message.setSenderName(senderName);
        message.setSenderAvatar(senderAvatar);
        message.setContent(request.getContent() != null ? request.getContent().trim() : "");
        message.setMessageType(request.getMessageType());
        message.setFileUrl(request.getFileUrl());
        message.setFileName(request.getFileName());
        message.setFileSize(request.getFileSize());
        message.setEmojiCode(request.getEmojiCode());
        message.setVoiceDuration(request.getVoiceDuration());
        message.setIsEdited(false);
        message.setCreatedAt(LocalDateTime.now());
        
        message = messageRepository.save(message);
        
        // Mettre à jour la conversation
        conversation.setLastMessageAt(LocalDateTime.now());
        conversationRepository.save(conversation);
        
        // Envoyer une notification à tous les participants (pour mettre à jour la liste des conversations)
        MessageDTO messageDTO = convertToMessageDTO(message);
        conversation.getParticipants().forEach(participant -> {
            if (participant.getIsActive()) {
                messagingTemplate.convertAndSendToUser(
                    participant.getUserId().toString(),
                    "/queue/messages",
                    messageDTO
                );
            }
        });
        
        log.info("Message {} sent successfully to conversation {} by user {}", 
                 message.getId(), conversationId, senderId);
        
        return messageDTO;
    }
    
    @Transactional
    public void markAsRead(Long conversationId, Long userId) {
        log.debug("Marking messages as read for conversation {} by user {}", conversationId, userId);
        
        ConversationParticipant participant = participantRepository
            .findByConversationIdAndUserId(conversationId, userId)
            .orElseThrow(() -> new UnauthorizedAccessException(conversationId, userId));
        
        LocalDateTime lastReadBefore = participant.getLastReadAt();
        LocalDateTime now = LocalDateTime.now();
        participant.setLastReadAt(now);
        participantRepository.save(participant);
        
        // Récupérer les IDs des messages qui viennent d'être lus
        List<Long> readMessageIds = messageRepository.findMessagesByConversationId(conversationId)
            .stream()
            .filter(m -> !m.getSenderId().equals(userId)) // Pas les messages de l'utilisateur lui-même
            .filter(m -> lastReadBefore == null || m.getCreatedAt().isAfter(lastReadBefore))
            .filter(m -> m.getCreatedAt().isBefore(now) || m.getCreatedAt().isEqual(now))
            .map(Message::getId)
            .collect(Collectors.toList());
        
        if (!readMessageIds.isEmpty()) {
            // Envoyer une notification WebSocket aux autres participants
            ReadStatusUpdateDTO update = new ReadStatusUpdateDTO();
            update.setConversationId(conversationId);
            update.setUserId(userId);
            update.setUserName(participant.getUserName());
            update.setMessageIds(readMessageIds);
            update.setReadAt(now);
            
            messagingTemplate.convertAndSend(
                "/topic/conversation/" + conversationId + "/read-status",
                update
            );
            
            log.debug("Sent read status update for {} messages in conversation {}", 
                     readMessageIds.size(), conversationId);
        }
    }
    
    @Transactional(readOnly = true)
    public Long getUnreadCount(Long userId) {
        return messageRepository.countUnreadMessages(userId);
    }
    
    private ConversationDTO convertToDTO(Conversation conversation, Long currentUserId) {
        ConversationDTO dto = new ConversationDTO();
        dto.setId(conversation.getId());
        dto.setType(conversation.getType());
        dto.setTitle(conversation.getTitle());
        dto.setDescription(conversation.getDescription());
        dto.setCreatedBy(conversation.getCreatedBy());
        dto.setGroupPhoto(conversation.getGroupPhoto());
        dto.setCreatedAt(conversation.getCreatedAt());
        dto.setLastMessageAt(conversation.getLastMessageAt());
        
        // Participants
        List<ParticipantDTO> participants = conversation.getParticipants().stream()
            .map(this::convertToParticipantDTO)
            .collect(Collectors.toList());
        dto.setParticipants(participants);
        
        // Dernier message
        if (!conversation.getMessages().isEmpty()) {
            Message lastMessage = conversation.getMessages().stream()
                .max((m1, m2) -> m1.getCreatedAt().compareTo(m2.getCreatedAt()))
                .orElse(null);
            if (lastMessage != null) {
                dto.setLastMessage(convertToMessageDTO(lastMessage));
            }
        }
        
        // Compter les messages non lus
        ConversationParticipant currentParticipant = conversation.getParticipants().stream()
            .filter(p -> p.getUserId().equals(currentUserId))
            .findFirst()
            .orElse(null);
        
        if (currentParticipant != null) {
            LocalDateTime lastRead = currentParticipant.getLastReadAt();
            long unreadCount = conversation.getMessages().stream()
                .filter(m -> !m.getSenderId().equals(currentUserId))
                .filter(m -> lastRead == null || m.getCreatedAt().isAfter(lastRead))
                .count();
            dto.setUnreadCount(unreadCount);
        } else {
            dto.setUnreadCount(0L);
        }
        
        return dto;
    }
    
    private ParticipantDTO convertToParticipantDTO(ConversationParticipant participant) {
        ParticipantDTO dto = new ParticipantDTO();
        dto.setUserId(participant.getUserId());
        
        // OPTIMISATION: Utiliser d'abord les données en cache (rapide)
        // Les données sont déjà stockées dans conversation_participants
        dto.setUserName(participant.getUserName());
        dto.setUserEmail(participant.getUserEmail());
        dto.setUserRole(participant.getUserRole());
        dto.setUserAvatar(participant.getUserAvatar());
        
        // Note: Pour rafraîchir les données utilisateur, utiliser un job asynchrone
        // ou un endpoint dédié plutôt que de bloquer chaque requête
        
        dto.setIsOnline(userPresenceService.isUserOnline(participant.getUserId()));
        dto.setLastReadAt(participant.getLastReadAt());
        dto.setRole(participant.getParticipantRole().name());
        return dto;
    }
    
    private MessageDTO convertToMessageDTO(Message message) {
        MessageDTO dto = new MessageDTO();
        dto.setId(message.getId());
        dto.setConversationId(message.getConversation().getId());
        dto.setSenderId(message.getSenderId());
        dto.setSenderName(message.getSenderName());
        dto.setSenderAvatar(message.getSenderAvatar());
        dto.setContent(message.getContent());
        dto.setMessageType(message.getMessageType());
        dto.setFileUrl(message.getFileUrl());
        dto.setFileName(message.getFileName());
        dto.setFileSize(message.getFileSize());
        dto.setEmojiCode(message.getEmojiCode());
        dto.setVoiceDuration(message.getVoiceDuration());
        dto.setIsEdited(message.getIsEdited());
        dto.setCreatedAt(message.getCreatedAt());
        dto.setUpdatedAt(message.getUpdatedAt());
        
        // Read statuses
        List<ReadStatusDTO> readStatuses = message.getReadStatuses().stream()
            .map(rs -> new ReadStatusDTO(rs.getUserId(), "User " + rs.getUserId(), rs.getReadAt()))
            .collect(Collectors.toList());
        dto.setReadBy(readStatuses);
        
        // Calculer le statut du message (SENT, DELIVERED, READ)
        dto.setStatus(calculateMessageStatus(message));
        
        // Reactions - récupérer les réactions pour ce message
        // Note: On ne peut pas obtenir le currentUserId ici, donc on passe null
        // Le frontend devra déterminer si l'utilisateur a réagi
        try {
            List<ReactionSummaryDTO> reactions = reactionService.getReactionSummary(message.getId(), null);
            dto.setReactions(reactions);
        } catch (Exception e) {
            log.warn("Failed to load reactions for message {}: {}", message.getId(), e.getMessage());
            dto.setReactions(new ArrayList<>());
        }
        
        return dto;
    }
    
    private MessageDTO.MessageStatus calculateMessageStatus(Message message) {
        // Si le message a été lu par au moins un destinataire (autre que l'expéditeur)
        boolean hasBeenRead = message.getReadStatuses().stream()
            .anyMatch(rs -> !rs.getUserId().equals(message.getSenderId()));
        
        if (hasBeenRead) {
            log.debug("Message {} status: READ (has been read by recipient)", message.getId());
            return MessageDTO.MessageStatus.READ;
        }
        
        // Vérifier si le message vient d'être créé (moins de 2 secondes)
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime createdAt = message.getCreatedAt();
        long secondsSinceCreation = java.time.Duration.between(createdAt, now).getSeconds();
        
        // Si le message a moins de 2 secondes, il est considéré comme SENT
        if (secondsSinceCreation < 2) {
            log.debug("Message {} status: SENT (created {} seconds ago)", message.getId(), secondsSinceCreation);
            return MessageDTO.MessageStatus.SENT;
        }
        
        // Sinon, si la conversation a d'autres participants, il est DELIVERED
        long participantCount = message.getConversation().getParticipants().size();
        if (participantCount > 1) {
            log.debug("Message {} status: DELIVERED ({} participants)", message.getId(), participantCount);
            return MessageDTO.MessageStatus.DELIVERED;
        }
        
        log.debug("Message {} status: SENT (default)", message.getId());
        return MessageDTO.MessageStatus.SENT;
    }
    
    public boolean hasAccessToConversation(Long conversationId, Long userId) {
        return participantRepository.existsByConversationIdAndUserId(conversationId, userId);
    }
    
    @Transactional
    public ConversationDTO addParticipantsToGroup(Long conversationId, AddParticipantsRequest request, Long currentUserId) {
        log.debug("Adding participants to group {} by user {}", conversationId, currentUserId);
        
        Conversation conversation = conversationRepository.findByIdWithParticipants(conversationId)
            .orElseThrow(() -> new ConversationNotFoundException(conversationId));
        
        // Vérifier que c'est un groupe
        if (conversation.getType() != Conversation.ConversationType.GROUP) {
            throw new MessageValidationException("Cannot add participants to a direct conversation");
        }
        
        // Vérifier que l'utilisateur est admin du groupe
        ConversationParticipant currentParticipant = participantRepository
            .findByConversationIdAndUserId(conversationId, currentUserId)
            .orElseThrow(() -> new UnauthorizedAccessException(conversationId, currentUserId));
        
        if (currentParticipant.getParticipantRole() != ConversationParticipant.ParticipantRole.ADMIN) {
            throw new UnauthorizedAccessException("Only admins can add participants to the group");
        }
        
        // Ajouter les nouveaux participants
        for (Long participantId : request.getParticipantIds()) {
            // Vérifier si le participant n'est pas déjà dans le groupe
            if (!participantRepository.existsByConversationIdAndUserId(conversationId, participantId)) {
                AuthServiceClient.UserInfo userInfo = authServiceClient.getUserInfo(participantId);
                addParticipantWithRole(conversation, participantId, userInfo.getFullName(), 
                             userInfo.getEmail(), userInfo.getRole(), userInfo.getProfilePhotoUrl(),
                             ConversationParticipant.ParticipantRole.MEMBER);
                
                log.info("User {} added to group {} by admin {}", participantId, conversationId, currentUserId);
            }
        }
        
        // Recharger la conversation
        conversation = conversationRepository.findByIdWithParticipants(conversationId)
            .orElseThrow(() -> new ConversationNotFoundException(conversationId));
        
        return convertToDTO(conversation, currentUserId);
    }
    
    @Transactional
    public void removeParticipantFromGroup(Long conversationId, Long participantId, Long currentUserId) {
        log.debug("Removing participant {} from group {} by user {}", participantId, conversationId, currentUserId);
        
        Conversation conversation = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new ConversationNotFoundException(conversationId));
        
        // Vérifier que c'est un groupe
        if (conversation.getType() != Conversation.ConversationType.GROUP) {
            throw new MessageValidationException("Cannot remove participants from a direct conversation");
        }
        
        // Vérifier que l'utilisateur est admin du groupe
        ConversationParticipant currentParticipant = participantRepository
            .findByConversationIdAndUserId(conversationId, currentUserId)
            .orElseThrow(() -> new UnauthorizedAccessException(conversationId, currentUserId));
        
        if (currentParticipant.getParticipantRole() != ConversationParticipant.ParticipantRole.ADMIN) {
            throw new UnauthorizedAccessException("Only admins can remove participants from the group");
        }
        
        // Ne pas permettre de retirer le dernier admin
        if (participantId.equals(currentUserId)) {
            long adminCount = conversation.getParticipants().stream()
                .filter(p -> p.getParticipantRole() == ConversationParticipant.ParticipantRole.ADMIN && p.getIsActive())
                .count();
            if (adminCount <= 1) {
                throw new MessageValidationException("Cannot remove the last admin from the group");
            }
        }
        
        // Marquer le participant comme inactif
        ConversationParticipant participant = participantRepository
            .findByConversationIdAndUserId(conversationId, participantId)
            .orElseThrow(() -> new ConversationNotFoundException("Participant not found"));
        
        participant.setIsActive(false);
        participantRepository.save(participant);
        
        log.info("User {} removed from group {} by admin {}", participantId, conversationId, currentUserId);
    }
    
    @Transactional
    public void leaveGroup(Long conversationId, Long userId) {
        log.debug("User {} leaving group {}", userId, conversationId);
        
        Conversation conversation = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new ConversationNotFoundException(conversationId));
        
        // Vérifier que c'est un groupe
        if (conversation.getType() != Conversation.ConversationType.GROUP) {
            throw new MessageValidationException("Cannot leave a direct conversation");
        }
        
        ConversationParticipant participant = participantRepository
            .findByConversationIdAndUserId(conversationId, userId)
            .orElseThrow(() -> new UnauthorizedAccessException(conversationId, userId));
        
        // Si c'est un admin, vérifier qu'il n'est pas le dernier
        if (participant.getParticipantRole() == ConversationParticipant.ParticipantRole.ADMIN) {
            long adminCount = conversation.getParticipants().stream()
                .filter(p -> p.getParticipantRole() == ConversationParticipant.ParticipantRole.ADMIN && p.getIsActive())
                .count();
            if (adminCount <= 1) {
                throw new MessageValidationException("Cannot leave the group as the last admin. Please assign another admin first.");
            }
        }
        
        participant.setIsActive(false);
        participantRepository.save(participant);
        
        log.info("User {} left group {}", userId, conversationId);
    }
    
    @Transactional
    public ConversationDTO updateGroup(Long conversationId, UpdateGroupRequest request, Long currentUserId) {
        log.debug("Updating group {} by user {}", conversationId, currentUserId);
        
        Conversation conversation = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new ConversationNotFoundException(conversationId));
        
        // Vérifier que c'est un groupe
        if (conversation.getType() != Conversation.ConversationType.GROUP) {
            throw new MessageValidationException("Cannot update a direct conversation");
        }
        
        // Vérifier que l'utilisateur est admin du groupe
        ConversationParticipant currentParticipant = participantRepository
            .findByConversationIdAndUserId(conversationId, currentUserId)
            .orElseThrow(() -> new UnauthorizedAccessException(conversationId, currentUserId));
        
        if (currentParticipant.getParticipantRole() != ConversationParticipant.ParticipantRole.ADMIN) {
            throw new UnauthorizedAccessException("Only admins can update the group");
        }
        
        conversation.setTitle(request.getTitle());
        conversation.setDescription(request.getDescription());
        conversation.setUpdatedAt(LocalDateTime.now());
        
        conversation = conversationRepository.save(conversation);
        
        log.info("Group {} updated by admin {}", conversationId, currentUserId);
        
        return convertToDTO(conversation, currentUserId);
    }
    
    @Transactional
    public void promoteToAdmin(Long conversationId, Long participantId, Long currentUserId) {
        log.debug("Promoting user {} to admin in group {} by user {}", participantId, conversationId, currentUserId);
        
        Conversation conversation = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new ConversationNotFoundException(conversationId));
        
        // Vérifier que c'est un groupe
        if (conversation.getType() != Conversation.ConversationType.GROUP) {
            throw new MessageValidationException("Cannot promote participants in a direct conversation");
        }
        
        // Vérifier que l'utilisateur est admin du groupe
        ConversationParticipant currentParticipant = participantRepository
            .findByConversationIdAndUserId(conversationId, currentUserId)
            .orElseThrow(() -> new UnauthorizedAccessException(conversationId, currentUserId));
        
        if (currentParticipant.getParticipantRole() != ConversationParticipant.ParticipantRole.ADMIN) {
            throw new UnauthorizedAccessException("Only admins can promote participants");
        }
        
        ConversationParticipant participant = participantRepository
            .findByConversationIdAndUserId(conversationId, participantId)
            .orElseThrow(() -> new ConversationNotFoundException("Participant not found"));
        
        participant.setParticipantRole(ConversationParticipant.ParticipantRole.ADMIN);
        participantRepository.save(participant);
        
        log.info("User {} promoted to admin in group {} by admin {}", participantId, conversationId, currentUserId);
    }
}
