package com.englishflow.messaging.controller;

import com.englishflow.messaging.client.AuthServiceClient;
import com.englishflow.messaging.constants.MessagingConstants;
import com.englishflow.messaging.dto.MessageDTO;
import com.englishflow.messaging.dto.NotificationDTO;
import com.englishflow.messaging.dto.SendMessageRequest;
import com.englishflow.messaging.exception.MessageValidationException;
import com.englishflow.messaging.exception.UnauthorizedAccessException;
import com.englishflow.messaging.service.MessagingService;
import com.englishflow.messaging.service.UserPresenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

@Controller
@RequiredArgsConstructor
@Slf4j
public class WebSocketController {
    
    private final SimpMessagingTemplate messagingTemplate;
    private final MessagingService messagingService;
    private final AuthServiceClient authServiceClient;
    private final UserPresenceService userPresenceService;
    
    @MessageMapping("/chat/{conversationId}")
    public void sendMessage(@DestinationVariable Long conversationId,
                           @Payload SendMessageRequest request,
                           SimpMessageHeaderAccessor headerAccessor,
                           Principal principal) {
        try {
            log.debug("WebSocket message received for conversation: {}", conversationId);
            
            if (principal == null) {
                log.error("No principal found in WebSocket message");
                sendErrorToUser(conversationId, "Authentication required");
                return;
            }
            
            // Récupérer l'ID utilisateur depuis le principal
            Long userId = Long.parseLong(principal.getName());
            
            // Récupérer les infos utilisateur depuis auth-service
            AuthServiceClient.UserInfo userInfo = authServiceClient.getUserInfo(userId);
            String senderName = userInfo.getFullName();
            String senderAvatar = userInfo.getProfilePhotoUrl();
            
            // Enregistrer le message (avec validation et vérification de sécurité)
            MessageDTO message = messagingService.sendMessage(
                conversationId, request, userId, senderName, senderAvatar);
            
            // Envoyer le message à tous les participants de la conversation
            String destination = MessagingConstants.WS_CONVERSATION_TOPIC + conversationId;
            messagingTemplate.convertAndSend(destination, message);
            
            // Envoyer une notification aux autres participants
            sendMessageNotification(conversationId, message, userId);
            
            log.info("Message {} sent successfully to conversation {} via WebSocket", 
                     message.getId(), conversationId);
            
        } catch (UnauthorizedAccessException e) {
            log.error("Unauthorized access attempt to conversation {}", conversationId, e);
            sendErrorToUser(conversationId, "You are not authorized to send messages to this conversation");
        } catch (MessageValidationException e) {
            log.error("Message validation failed for conversation {}", conversationId, e);
            sendErrorToUser(conversationId, e.getMessage());
        } catch (Exception e) {
            log.error("Error sending message via WebSocket to conversation {}", conversationId, e);
            sendErrorToUser(conversationId, "Failed to send message. Please try again.");
        }
    }
    
    @MessageMapping("/typing/{conversationId}")
    public void sendTypingIndicator(@DestinationVariable Long conversationId,
                                    @Payload Map<String, Object> payload,
                                    Principal principal) {
        try {
            if (principal == null) {
                log.error("No principal found in typing indicator");
                return;
            }
            
            Long userId = Long.parseLong(principal.getName());
            
            // Récupérer les infos utilisateur
            AuthServiceClient.UserInfo userInfo = authServiceClient.getUserInfo(userId);
            
            Map<String, Object> typingIndicator = new HashMap<>();
            typingIndicator.put("conversationId", conversationId);
            typingIndicator.put("userId", userId);
            typingIndicator.put("userName", userInfo.getFullName());
            typingIndicator.put("isTyping", payload.get("isTyping"));
            
            // Envoyer l'indicateur de frappe aux autres participants
            String destination = MessagingConstants.WS_CONVERSATION_TOPIC + conversationId + 
                               MessagingConstants.WS_TYPING_SUFFIX;
            messagingTemplate.convertAndSend(destination, typingIndicator);
            
            log.debug("Typing indicator sent for conversation {} by user {}", conversationId, userId);
            
        } catch (Exception e) {
            log.error("Error sending typing indicator for conversation {}", conversationId, e);
        }
    }
    
    @MessageMapping("/presence/online")
    public void markUserOnline(Principal principal) {
        try {
            if (principal == null) {
                log.error("No principal found in presence update");
                return;
            }
            
            Long userId = Long.parseLong(principal.getName());
            userPresenceService.markUserOnline(userId);
            
            // Broadcast online status to all users
            Map<String, Object> presenceUpdate = new HashMap<>();
            presenceUpdate.put("userId", userId);
            presenceUpdate.put("isOnline", true);
            
            messagingTemplate.convertAndSend("/topic/presence", presenceUpdate);
            
            log.debug("User {} marked as online", userId);
            
        } catch (Exception e) {
            log.error("Error marking user as online", e);
        }
    }
    
    @MessageMapping("/presence/heartbeat")
    public void heartbeat(Principal principal) {
        try {
            if (principal == null) {
                return;
            }
            
            Long userId = Long.parseLong(principal.getName());
            userPresenceService.refreshUserPresence(userId);
            
            log.trace("Heartbeat received from user {}", userId);
            
        } catch (Exception e) {
            log.error("Error processing heartbeat", e);
        }
    }
    
    private void sendErrorToUser(Long conversationId, String errorMessage) {
        Map<String, Object> error = new HashMap<>();
        error.put("error", true);
        error.put("message", errorMessage);
        error.put("conversationId", conversationId);
        
        String destination = MessagingConstants.WS_CONVERSATION_TOPIC + conversationId + "/error";
        messagingTemplate.convertAndSend(destination, error);
    }
    
    private void sendMessageNotification(Long conversationId, MessageDTO message, Long senderId) {
        try {
            // Récupérer les participants de la conversation
            var conversation = messagingService.getConversation(conversationId, senderId);
            
            // Envoyer une notification à chaque participant (sauf l'expéditeur)
            conversation.getParticipants().forEach(participant -> {
                if (!participant.getUserId().equals(senderId)) {
                    NotificationDTO notification = new NotificationDTO();
                    notification.setUserId(participant.getUserId());
                    notification.setType("MESSAGE");
                    notification.setTitle("Nouveau message");
                    notification.setMessage(message.getSenderName() + " vous a envoyé un message");
                    notification.setSenderName(message.getSenderName());
                    notification.setSenderAvatar(message.getSenderAvatar());
                    notification.setConversationId(conversationId);
                    notification.setMessageId(message.getId());
                    notification.setCreatedAt(message.getCreatedAt());
                    notification.setIsRead(false);
                    
                    // Envoyer la notification via WebSocket
                    String destination = "/topic/user/" + participant.getUserId() + "/notifications";
                    messagingTemplate.convertAndSend(destination, notification);
                    
                    log.debug("Notification sent to user {} for message {}", participant.getUserId(), message.getId());
                }
            });
        } catch (Exception e) {
            log.error("Error sending message notification for conversation {}", conversationId, e);
        }
    }
}
