import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MessagingService } from '../../../../core/services/messaging.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Conversation } from '../../../../core/models/conversation.model';
import { Message, SendMessageRequest, MessageType } from '../../../../core/models/message.model';
import { NewConversationModalComponent } from '../new-conversation-modal/new-conversation-modal.component';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

@Component({
  selector: 'app-messaging-container',
  standalone: true,
  imports: [CommonModule, FormsModule, NewConversationModalComponent],
  templateUrl: './messaging-container.component.html',
  styleUrls: ['./messaging-container.component.scss']
})
export class MessagingContainerComponent implements OnInit, OnDestroy {
  @ViewChild('messageInput') messageInput!: ElementRef<HTMLInputElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  conversations: Conversation[] = [];
  filteredConversations: Conversation[] = [];
  selectedConversation: Conversation | null = null;
  selectedConversationId: number | null = null;
  messages: Message[] = [];
  currentUserId: number = 0;
  newMessage: string = '';
  searchQuery: string = '';
  isTyping: boolean = false;
  showNewConversationModal: boolean = false;
  showEmojiPicker: boolean = false;
  hoveredMessageId: number | null = null;
  showReactionPicker: { [messageId: number]: boolean } = {};
  selectedFile: File | null = null;
  filePreviewUrl: string | null = null;
  uploadingFile: boolean = false;
  imageUrls: { [messageId: number]: string } = {}; // Cache des URLs blob pour les images
  audioUrls: { [messageId: number]: string } = {}; // Cache des URLs blob pour les audios
  
  // Image modal
  selectedImageUrl: string | null = null;
  selectedImageName: string = '';
  
  // Voice recording
  isRecording: boolean = false;
  recordingTime: number = 0;
  mediaRecorder: MediaRecorder | null = null;
  audioChunks: Blob[] = [];
  recordingInterval: any = null;
  audioBlob: Blob | null = null;
  audioUrl: string | null = null;
  
  private hoverTimeout: any = null;
  
  popularEmojis: string[] = [
    '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
    '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛',
    '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥳', '😏', '😒',
    '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩',
    '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵',
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
    '👆', '👇', '☝️', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
    '✨', '⭐', '🌟', '💫', '🔥', '💥', '💯', '✅', '🎉', '🎊'
  ];
  
  quickReactionEmojis: string[] = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
  
  // WebSocket
  private stompClient: Client | null = null;
  private connected: boolean = false;
  
  private destroy$ = new Subject<void>();
  private typingTimeout: any;

  constructor(
    private messagingService: MessagingService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.currentUserId = currentUser.id;
    }
    this.loadConversations();
    this.connectWebSocket();
  }

  ngOnDestroy(): void {
    // Nettoyer les URLs blob pour éviter les fuites mémoire
    Object.values(this.imageUrls).forEach(url => {
      window.URL.revokeObjectURL(url);
    });
    Object.values(this.audioUrls).forEach(url => {
      window.URL.revokeObjectURL(url);
    });
    
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnectWebSocket();
  }

  connectWebSocket(): void {
    // Récupérer le token JWT
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.error('No JWT token found in localStorage');
      return;
    }
    
    console.log('Connecting WebSocket with token');
    
    const socket = new SockJS('http://localhost:8084/ws');
    this.stompClient = new Client({
      webSocketFactory: () => socket as any,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      connectHeaders: {
        'Authorization': `Bearer ${token}`
      },
      debug: (str) => {
        console.log('STOMP: ' + str);
      }
    });

    this.stompClient.onConnect = (frame) => {
      console.log('WebSocket Connected successfully', frame);
      this.connected = true;
    };

    this.stompClient.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    this.stompClient.activate();
  }

  disconnectWebSocket(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.connected = false;
    }
  }

  sendWebSocketMessage(conversationId: number, request: SendMessageRequest): void {
    if (this.stompClient && this.connected) {
      this.stompClient.publish({
        destination: `/app/chat/${conversationId}`,
        body: JSON.stringify(request)
      });
    }
  }

  sendTypingIndicator(isTyping: boolean): void {
    if (!this.selectedConversation || !this.stompClient || !this.connected) return;
    
    this.stompClient.publish({
      destination: `/app/typing/${this.selectedConversation.id}`,
      body: JSON.stringify({ userId: this.currentUserId, isTyping })
    });
  }

  loadConversations(): void {
    this.messagingService.getConversations()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (conversations) => {
          this.conversations = conversations;
          this.filteredConversations = conversations;
        },
        error: (error) => console.error('Error loading conversations:', error)
      });
  }

  filterConversations(): void {
    if (!this.searchQuery.trim()) {
      this.filteredConversations = this.conversations;
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredConversations = this.conversations.filter(conv =>
        this.getTitle(conv).toLowerCase().includes(query)
      );
    }
  }

  selectConversation(id: number): void {
    this.selectedConversationId = id;
    this.messages = [];
    if (this.selectedConversation) {
      // Les subscriptions WebSocket seront nettoyées automatiquement
    }
    this.messagingService.getConversation(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (conversation) => {
          this.selectedConversation = conversation;
          this.loadMessages(id);
          this.subscribeToWebSocket(id);
          this.markAsRead(id);
        }
      });
  }

  loadMessages(conversationId: number): void {
    this.messagingService.getMessages(conversationId, 0, 50)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (page) => {
          this.messages = page.content.reverse();
          // S'abonner aux réactions pour tous les messages chargés
          this.subscribeToReactionUpdates();
          // Charger les images avec authentification
          this.loadMessageImages();
          setTimeout(() => this.scrollToBottom(), 100);
        }
      });
  }

  subscribeToWebSocket(conversationId: number): void {
    if (!this.stompClient || !this.connected) {
      console.error('WebSocket not connected');
      return;
    }

    // Subscribe to messages
    this.stompClient.subscribe(
      `/topic/conversation/${conversationId}`,
      (message: IMessage) => {
        const messageData = JSON.parse(message.body);
        if (messageData.conversationId === conversationId) {
          const exists = this.messages.some(m => m.id === messageData.id);
          if (!exists) {
            this.messages = [...this.messages, messageData];
            // S'abonner aux réactions pour le nouveau message
            this.subscribeToMessageReactions(messageData.id);
            // Charger l'image si c'est un message avec image
            if (this.isImageMessage(messageData)) {
              this.loadImageForMessage(messageData);
            }
            // Charger l'audio si c'est un message vocal
            if (messageData.messageType === 'VOICE') {
              this.loadAudioForMessage(messageData);
            }
            setTimeout(() => this.scrollToBottom(), 100);
          }
        }
      }
    );

    // Subscribe to typing indicator
    this.stompClient.subscribe(
      `/topic/conversation/${conversationId}/typing`,
      (message: IMessage) => {
        const indicator = JSON.parse(message.body);
        if (indicator.userId !== this.currentUserId) {
          this.isTyping = indicator.isTyping;
        }
      }
    );
  }
  
  subscribeToReactionUpdates(): void {
    // S'abonner aux mises à jour de réactions pour chaque message
    this.messages.forEach(message => {
      this.subscribeToMessageReactions(message.id);
    });
  }
  
  subscribeToMessageReactions(messageId: number): void {
    if (!this.stompClient || !this.connected) {
      return;
    }

    this.stompClient.subscribe(
      `/topic/message/${messageId}/reactions`,
      (message: IMessage) => {
        const reactions = JSON.parse(message.body);
        console.log('Received reaction update for message', messageId, reactions);
        const msg = this.messages.find(m => m.id === messageId);
        if (msg) {
          msg.reactions = reactions;
          console.log('Updated message reactions:', msg);
        }
      }
    );
  }

  sendMessage(): void {
    console.log('sendMessage called', {
      conversation: this.selectedConversation,
      selectedFile: this.selectedFile,
      newMessage: this.newMessage
    });
    
    if (!this.selectedConversation) {
      console.log('No conversation selected');
      return;
    }
    
    // Si un fichier est sélectionné, l'uploader d'abord
    if (this.selectedFile) {
      console.log('File selected, uploading...');
      this.uploadAndSendFile();
      return;
    }
    
    // Sinon, envoyer un message texte normal
    if (!this.newMessage.trim()) {
      console.log('No message text');
      return;
    }
    
    console.log('Sending text message...');
    const request: SendMessageRequest = {
      content: this.newMessage.trim(),
      messageType: MessageType.TEXT
    };
    this.sendWebSocketMessage(this.selectedConversation.id, request);
    this.newMessage = '';
  }
  
  uploadAndSendFile(): void {
    if (!this.selectedConversation || !this.selectedFile) {
      console.log('Cannot upload: no conversation or no file', {
        conversation: this.selectedConversation,
        file: this.selectedFile
      });
      return;
    }
    
    console.log('Starting file upload...', this.selectedFile.name);
    this.uploadingFile = true;
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    
    console.log('Calling uploadFile service...');
    this.messagingService.uploadFile(formData).subscribe({
      next: (response) => {
        console.log('File uploaded successfully:', response);
        
        // Envoyer le message avec le fichier
        const request: SendMessageRequest = {
          content: this.newMessage.trim() || '',
          messageType: MessageType.FILE,
          fileUrl: response.fileUrl,
          fileName: response.fileName,
          fileSize: parseInt(response.fileSize)
        };
        
        console.log('Sending file message via WebSocket:', request);
        this.sendWebSocketMessage(this.selectedConversation!.id, request);
        
        // Réinitialiser
        this.newMessage = '';
        this.removeSelectedFile();
        this.uploadingFile = false;
        console.log('File upload complete');
      },
      error: (error) => {
        console.error('Error uploading file:', error);
        alert('Erreur lors de l\'upload du fichier. Veuillez réessayer.');
        this.uploadingFile = false;
      }
    });
  }
  
  onFileSelected(event: any): void {
    console.log('File selected event:', event);
    const file = event.target.files[0];
    console.log('Selected file:', file);
    
    if (file) {
      // Vérifier la taille (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert('Le fichier est trop volumineux. Taille maximale : 10MB');
        return;
      }
      
      console.log('File accepted:', file.name, file.type, file.size);
      this.selectedFile = file;
      console.log('selectedFile set to:', this.selectedFile);
      
      // Créer une preview pour les images
      if (file.type.startsWith('image/')) {
        console.log('Creating image preview...');
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.filePreviewUrl = e.target.result;
          console.log('Image preview created, URL length:', this.filePreviewUrl?.length);
          this.cdr.detectChanges(); // Forcer la détection de changement
        };
        reader.readAsDataURL(file);
      } else {
        console.log('Non-image file, no preview');
        this.filePreviewUrl = null;
      }
      
      // Forcer la détection de changement
      this.cdr.detectChanges();
      console.log('After detectChanges, selectedFile:', this.selectedFile);
      
      // Vérifier si l'élément DOM existe
      setTimeout(() => {
        const previewElement = document.querySelector('.file-preview');
        console.log('Preview element in DOM:', previewElement);
      }, 100);
    } else {
      console.log('No file selected');
    }
    
    // Réinitialiser l'input pour permettre de sélectionner le même fichier
    event.target.value = '';
  }
  
  removeSelectedFile(): void {
    this.selectedFile = null;
    this.filePreviewUrl = null;
  }
  
  isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }
  
  isImageMessage(message: Message): boolean {
    if (message.messageType !== 'FILE') return false;
    const fileName = message.fileName?.toLowerCase() || '';
    return fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || 
           fileName.endsWith('.png') || fileName.endsWith('.gif') || 
           fileName.endsWith('.webp');
  }
  
  getFileUrl(fileUrl?: string): string {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http')) return fileUrl;
    return `http://localhost:8088${fileUrl}`;
  }
  
  formatFileSize(bytes?: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  onTyping(): void {
    if (!this.selectedConversation) return;
    if (this.typingTimeout) clearTimeout(this.typingTimeout);
    this.sendTypingIndicator(true);
    this.typingTimeout = setTimeout(() => {
      this.sendTypingIndicator(false);
    }, 2000);
  }

  markAsRead(conversationId: number): void {
    this.messagingService.markAsRead(conversationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const conv = this.conversations.find(c => c.id === conversationId);
          if (conv) conv.unreadCount = 0;
        }
      });
  }

  scrollToBottom(): void {
    const messagesArea = document.querySelector('.messages-area');
    if (messagesArea) {
      messagesArea.scrollTop = messagesArea.scrollHeight;
    }
  }

  getTitle(conv: Conversation): string {
    if (conv.title) return conv.title;
    const other = conv.participants.find(p => p.userId !== this.currentUserId);
    // Utiliser userName s'il existe et n'est pas vide, sinon utiliser l'email
    if (other?.userName && other.userName !== 'User' && other.userName.trim() !== '') {
      return other.userName;
    }
    // Fallback sur l'email si userName n'est pas disponible
    return other?.userEmail?.split('@')[0] || 'Conversation';
  }

  getAvatar(conv: Conversation): string {
    const other = conv.participants.find(p => p.userId !== this.currentUserId);
    if (other?.userAvatar && !other.userAvatar.includes('ui-avatars.com')) {
      return `http://localhost:8088${other.userAvatar}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.getTitle(conv))}&background=667eea&color=fff&bold=true&size=128`;
  }

  isOnline(conv: Conversation): boolean {
    const other = conv.participants.find(p => p.userId !== this.currentUserId);
    return other?.isOnline || false;
  }

  formatTime(date?: Date): string {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'maintenant';
    if (mins < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}j`;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }

  formatMessageTime(date?: Date): string {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  onConversationCreated(conversationId: number): void {
    this.showNewConversationModal = false;
    this.loadConversations();
    setTimeout(() => {
      this.selectConversation(conversationId);
    }, 500);
  }

  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  insertEmoji(emoji: string): void {
    this.newMessage += emoji;
    this.showEmojiPicker = false;
    this.messageInput.nativeElement.focus();
  }
  
  sendEmojiAsMessage(emoji: string): void {
    if (!this.selectedConversation) return;
    
    const emojiCode = this.getEmojiUnicode(emoji);
    const request: SendMessageRequest = {
      content: emoji,
      messageType: MessageType.EMOJI,
      emojiCode: emojiCode
    };
    
    this.sendWebSocketMessage(this.selectedConversation.id, request);
    this.showEmojiPicker = false;
  }
  
  getEmojiUnicode(emoji: string): string {
    const codePoint = emoji.codePointAt(0);
    return codePoint ? `U+${codePoint.toString(16).toUpperCase()}` : emoji;
  }

  addEmoji(event: any): void {
    const emoji = event.emoji.native;
    this.newMessage += emoji;
    this.messageInput.nativeElement.focus();
  }

  encodeURIComponent(str: string): string {
    return encodeURIComponent(str);
  }

  addReaction(messageId: number, emoji: string): void {
    this.messagingService.toggleReaction(messageId, emoji)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // La mise à jour sera reçue via WebSocket
          console.log('Reaction toggled:', emoji, 'on message', messageId);
          this.closeReactionPicker(messageId);
        },
        error: (error) => console.error('Error toggling reaction:', error)
      });
  }

  getReactionTooltip(reaction: any): string {
    if (reaction.userNames.length === 0) return '';
    if (reaction.userNames.length === 1) return reaction.userNames[0];
    if (reaction.userNames.length === 2) {
      return `${reaction.userNames[0]} et ${reaction.userNames[1]}`;
    }
    return `${reaction.userNames[0]}, ${reaction.userNames[1]} et ${reaction.userNames.length - 2} autre(s)`;
  }
  
  toggleReactionPicker(messageId: number): void {
    this.showReactionPicker[messageId] = !this.showReactionPicker[messageId];
  }
  
  onMessageMouseEnter(messageId: number): void {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }
    this.hoveredMessageId = messageId;
  }
  
  onMessageMouseLeave(messageId: number): void {
    // Délai plus long avant de cacher le bouton pour permettre de cliquer facilement
    this.hoverTimeout = setTimeout(() => {
      // Ne cacher que si le picker n'est pas ouvert
      if (!this.showReactionPicker[messageId]) {
        this.hoveredMessageId = null;
      }
    }, 800);
  }
  
  closeReactionPicker(messageId: number): void {
    this.showReactionPicker[messageId] = false;
    this.hoveredMessageId = null;
  }
  
  hasReactions(message: Message): boolean {
    return !!(message.reactions && message.reactions.length > 0);
  }
  
  focusInput(): void {
    if (this.messageInput) {
      this.messageInput.nativeElement.focus();
    }
  }
  
  getMessageStatusIcon(message: Message): string {
    if (message.senderId !== this.currentUserId) {
      return ''; // Pas de statut pour les messages reçus
    }
    
    console.log('Message', message.id, 'status:', message.status);
    
    switch (message.status) {
      case 'READ':
        return '✓✓'; // Double check bleu
      case 'DELIVERED':
        return '✓✓'; // Double check gris
      case 'SENT':
        return '✓'; // Simple check
      default:
        return '⏱'; // Horloge pour en attente
    }
  }
  
  getMessageStatusClass(message: Message): string {
    if (message.senderId !== this.currentUserId) {
      return '';
    }
    
    switch (message.status) {
      case 'READ':
        return 'status-read';
      case 'DELIVERED':
        return 'status-delivered';
      case 'SENT':
        return 'status-sent';
      default:
        return 'status-pending';
    }
  }
  
  downloadFile(fileUrl?: string, fileName?: string): void {
    if (!fileUrl) return;
    
    console.log('Downloading file:', fileUrl, fileName);
    
    // Utiliser HttpClient pour télécharger le fichier avec les headers d'authentification
    const url = this.getFileUrl(fileUrl);
    
    this.messagingService.downloadFile(url).subscribe({
      next: (blob) => {
        // Créer un lien temporaire pour télécharger le fichier
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = fileName || 'download';
        link.click();
        window.URL.revokeObjectURL(link.href);
        console.log('File downloaded successfully');
      },
      error: (error) => {
        console.error('Error downloading file:', error);
        alert('Erreur lors du téléchargement du fichier');
      }
    });
  }
  
  onImageError(event: any): void {
    console.error('Error loading image:', event);
    event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub24gZGlzcG9uaWJsZTwvdGV4dD48L3N2Zz4=';
  }
  
  loadMessageImages(): void {
    this.messages.forEach(message => {
      if (this.isImageMessage(message)) {
        this.loadImageForMessage(message);
      }
      if (message.messageType === 'VOICE') {
        this.loadAudioForMessage(message);
      }
    });
  }
  
  loadImageForMessage(message: Message): void {
    if (!message.fileUrl || !message.id) return;
    
    const url = this.getFileUrl(message.fileUrl);
    console.log('Loading image for message', message.id, 'from', url);
    
    this.messagingService.downloadFile(url).subscribe({
      next: (blob) => {
        // Créer une URL blob pour l'image
        const blobUrl = window.URL.createObjectURL(blob);
        this.imageUrls[message.id!] = blobUrl;
        console.log('Image loaded successfully for message', message.id);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading image for message', message.id, error);
      }
    });
  }
  
  getImageUrl(message: Message): string {
    if (message.id && this.imageUrls[message.id]) {
      return this.imageUrls[message.id];
    }
    // Retourner une image placeholder en attendant le chargement
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5DaGFyZ2VtZW50Li4uPC90ZXh0Pjwvc3ZnPg==';
  }
  
  loadAudioForMessage(message: Message): void {
    if (!message.fileUrl || !message.id) return;
    
    const url = this.getFileUrl(message.fileUrl);
    console.log('Loading audio for message', message.id, 'from', url);
    
    this.messagingService.downloadFile(url).subscribe({
      next: (blob) => {
        // Créer une URL blob pour l'audio
        const blobUrl = window.URL.createObjectURL(blob);
        this.audioUrls[message.id!] = blobUrl;
        console.log('Audio loaded successfully for message', message.id);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading audio for message', message.id, error);
      }
    });
  }
  
  getAudioUrl(message: Message): string | null {
    if (message.id && this.audioUrls[message.id]) {
      return this.audioUrls[message.id];
    }
    return null;
  }
  
  // ===== VOICE RECORDING =====
  
  async startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      this.recordingTime = 0;
      
      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };
      
      this.mediaRecorder.onstop = () => {
        this.audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.audioUrl = URL.createObjectURL(this.audioBlob);
        console.log('Recording stopped, duration:', this.recordingTime, 'seconds');
      };
      
      this.mediaRecorder.start();
      this.isRecording = true;
      
      // Compteur de temps
      this.recordingInterval = setInterval(() => {
        this.recordingTime++;
        // Limite à 5 minutes
        if (this.recordingTime >= 300) {
          this.stopRecording();
        }
      }, 1000);
      
      console.log('Recording started');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Impossible d\'accéder au microphone. Veuillez autoriser l\'accès.');
    }
  }
  
  stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      this.isRecording = false;
      
      if (this.recordingInterval) {
        clearInterval(this.recordingInterval);
        this.recordingInterval = null;
      }
      
      console.log('Recording stopped');
    }
  }
  
  cancelRecording(): void {
    this.stopRecording();
    this.audioBlob = null;
    this.audioUrl = null;
    this.recordingTime = 0;
    this.audioChunks = [];
    console.log('Recording cancelled');
  }
  
  async sendVoiceMessage(): Promise<void> {
    if (!this.selectedConversation || !this.audioBlob) {
      console.log('Cannot send voice: no conversation or no audio');
      return;
    }
    
    console.log('Sending voice message, duration:', this.recordingTime, 'seconds');
    this.uploadingFile = true;
    
    // Créer un fichier à partir du blob
    const file = new File([this.audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('file', file);
    
    this.messagingService.uploadFile(formData).subscribe({
      next: (response) => {
        console.log('Voice file uploaded:', response);
        
        // Envoyer le message vocal
        const request: SendMessageRequest = {
          content: '',
          messageType: MessageType.VOICE,
          fileUrl: response.fileUrl,
          fileName: response.fileName,
          fileSize: parseInt(response.fileSize),
          voiceDuration: this.recordingTime
        };
        
        console.log('Sending voice message via WebSocket:', request);
        this.sendWebSocketMessage(this.selectedConversation!.id, request);
        
        // Réinitialiser
        this.cancelRecording();
        this.uploadingFile = false;
        console.log('Voice message sent');
      },
      error: (error) => {
        console.error('Error uploading voice:', error);
        alert('Erreur lors de l\'envoi du message vocal');
        this.uploadingFile = false;
      }
    });
  }
  
  formatRecordingTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  formatVoiceDuration(seconds?: number): string {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  playVoiceMessage(event: Event, messageId: number, fileUrl?: string): void {
    if (!fileUrl) return;
    
    const button = event.currentTarget as HTMLElement;
    const audioElement = button.parentElement?.querySelector('audio') as HTMLAudioElement;
    
    if (!audioElement) {
      console.error('Audio element not found');
      return;
    }
    
    // Attendre que l'audio soit chargé si nécessaire
    if (!this.audioUrls[messageId]) {
      console.log('Audio not loaded yet, waiting...');
      setTimeout(() => this.playVoiceMessage(event, messageId, fileUrl), 500);
      return;
    }
    
    if (audioElement.paused) {
      // Pause tous les autres audios
      document.querySelectorAll('audio').forEach(audio => {
        if (audio !== audioElement) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
      
      // Jouer cet audio
      audioElement.play();
      button.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>';
      
      audioElement.onended = () => {
        button.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
      };
    } else {
      // Pause
      audioElement.pause();
      button.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    }
  }
  
  // ===== IMAGE MODAL METHODS =====
  openImageModal(message: Message): void {
    if (message.messageType === 'FILE' && this.isImageMessage(message)) {
      this.selectedImageUrl = this.getImageUrl(message);
      this.selectedImageName = message.fileName || 'Image';
    }
  }
  
  closeImageModal(): void {
    this.selectedImageUrl = null;
    this.selectedImageName = '';
  }
}
