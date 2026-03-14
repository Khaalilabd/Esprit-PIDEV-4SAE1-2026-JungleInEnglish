import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Conversation } from '../../../../core/models/conversation.model';
import { Message } from '../../../../core/models/message.model';
import { MessageBubbleComponent } from '../message-bubble/message-bubble.component';
import { TypingIndicatorComponent } from '../typing-indicator/typing-indicator.component';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [CommonModule, FormsModule, MessageBubbleComponent, TypingIndicatorComponent],
  template: `
    <div class="flex flex-col h-full bg-[#0b141a]">
      <!-- Chat Header -->
      <div class="px-4 py-3 bg-[#202c33] flex items-center gap-3 shadow-md">
        <img 
          [src]="getConversationAvatar()" 
          [alt]="getConversationTitle()" 
          class="w-10 h-10 rounded-full object-cover ring-2 ring-[#2a3942]"
        >
        <div class="flex-1">
          <h3 class="font-medium text-white">{{ getConversationTitle() }}</h3>
          <p class="text-xs text-[#00a884]" *ngIf="isOnline()">en ligne</p>
          <p class="text-xs text-[#aebac1]" *ngIf="!isOnline() && conversation">hors ligne</p>
        </div>
        <div class="flex gap-2">
          <!-- Search in conversation -->
          <button 
            (click)="toggleSearch()"
            class="p-2 text-[#aebac1] hover:bg-[#2a3942] rounded-full transition-colors"
            title="Rechercher"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </button>
          
          <!-- More options -->
          <button class="p-2 text-[#aebac1] hover:bg-[#2a3942] rounded-full transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Search Bar (collapsible) -->
      <div *ngIf="showSearch" class="px-4 py-2 bg-[#202c33] border-b border-[#2a3942]">
        <div class="relative">
          <input 
            type="text" 
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchMessages()"
            placeholder="Rechercher dans la conversation..." 
            class="w-full px-4 py-2 pl-10 bg-[#2a3942] border border-[#3b4a54] rounded-lg text-white placeholder-[#aebac1] focus:outline-none focus:border-[#00a884]"
          />
          <svg class="w-5 h-5 text-[#aebac1] absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
      </div>

      <!-- Messages Area with WhatsApp Background Pattern -->
      <div 
        #messagesContainer
        class="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar chat-background"
        (scroll)="onScroll($event)"
      >
        <!-- Load More Button -->
        <div *ngIf="messages.length >= 50" class="text-center py-2">
          <button 
            (click)="loadMore.emit()"
            class="px-4 py-2 text-sm text-[#00a884] bg-[#202c33] hover:bg-[#2a3942] rounded-full transition-colors shadow-lg"
          >
            ↑ Charger plus de messages
          </button>
        </div>

        <!-- Messages -->
        <app-message-bubble
          *ngFor="let message of filteredMessages; trackBy: trackByMessageId"
          [message]="message"
          [isMine]="message.senderId === currentUserId"
          (react)="onReact($event)"
        ></app-message-bubble>

        <!-- Typing Indicator -->
        <app-typing-indicator
          *ngIf="isTyping"
          [userName]="typingUserName"
        ></app-typing-indicator>
      </div>

      <!-- Message Input -->
      <div class="px-4 py-3 bg-[#202c33]">
        <div class="flex items-center gap-2">
          <!-- Emoji Picker Button -->
          <button 
            (click)="toggleEmojiPicker()"
            class="p-2 text-[#aebac1] hover:bg-[#2a3942] rounded-full transition-colors"
            title="Emoji"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </button>
          
          <!-- Attach File Button -->
          <button 
            (click)="fileInput.click()"
            class="p-2 text-[#aebac1] hover:bg-[#2a3942] rounded-full transition-colors"
            title="Joindre un fichier"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
            </svg>
          </button>
          <input 
            #fileInput
            type="file" 
            (change)="onFileSelected($event)"
            accept="image/*,.pdf,.doc,.docx,.txt"
            class="hidden"
          />
          
          <!-- Input Field -->
          <div class="flex-1 relative">
            <input 
              [(ngModel)]="newMessage"
              (keyup.enter)="sendMessage()"
              (input)="onTyping()"
              type="text" 
              placeholder="Tapez un message" 
              class="w-full px-4 py-2.5 bg-[#2a3942] text-white placeholder-[#aebac1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a884]"
            />
          </div>
          
          <!-- Send/Voice Button -->
          <button 
            *ngIf="newMessage.trim()"
            (click)="sendMessage()"
            class="p-2.5 bg-[#00a884] text-[#111b21] rounded-full hover:bg-[#06cf9c] transition-all transform hover:scale-105 shadow-lg"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
            </svg>
          </button>
          
          <button 
            *ngIf="!newMessage.trim()"
            (click)="startVoiceRecording()"
            [class.recording]="isRecording"
            class="p-2 text-[#aebac1] hover:bg-[#2a3942] rounded-full transition-colors"
            title="Message vocal"
          >
            <svg class="w-6 h-6" [class.text-red-500]="isRecording" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
            </svg>
          </button>
        </div>
        
        <!-- File Preview -->
        <div *ngIf="selectedFile" class="mt-2 p-3 bg-[#2a3942] rounded-lg flex items-center justify-between">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-[#00a884]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <span class="text-sm text-white">{{ selectedFile.name }}</span>
          </div>
          <button (click)="selectedFile = null" class="text-[#aebac1] hover:text-white">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Emoji Picker (Simple) -->
      <div *ngIf="showEmojiPicker" class="absolute bottom-20 left-4 bg-[#202c33] rounded-lg shadow-2xl p-4 z-50 border border-[#2a3942]">
        <div class="grid grid-cols-8 gap-2">
          <button 
            *ngFor="let emoji of emojis"
            (click)="insertEmoji(emoji)"
            class="text-2xl hover:bg-[#2a3942] rounded p-1 transition-colors"
          >
            {{ emoji }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    
    .chat-background {
      background-color: #0b141a;
      background-image: 
        repeating-linear-gradient(
          45deg,
          transparent,
          transparent 10px,
          rgba(255, 255, 255, 0.02) 10px,
          rgba(255, 255, 255, 0.02) 20px
        );
    }
  `]
})
export class ChatWindowComponent implements AfterViewChecked, OnChanges {
  @Input() conversation!: Conversation;
  @Input() messages: Message[] = [];
  @Input() currentUserId: number = 0;
  @Input() isTyping: boolean = false;
  @Input() typingUserName: string = '';
  @Output() messageSent = new EventEmitter<string>();
  @Output() loadMore = new EventEmitter<void>();
  @Output() typing = new EventEmitter<boolean>();

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  newMessage: string = '';
  searchQuery: string = '';
  showSearch: boolean = false;
  showEmojiPicker: boolean = false;
  selectedFile: File | null = null;
  isRecording: boolean = false;
  filteredMessages: Message[] = [];
  
  private shouldScrollToBottom = true;
  private typingTimeout: any;

  // Emojis populaires
  emojis: string[] = [
    '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊',
    '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘',
    '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪',
    '🤨', '🧐', '🤓', '😎', '🥳', '😏', '😒', '😞',
    '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫',
    '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙',
    '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
    '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💬',
    '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉'
  ];

  ngOnChanges(): void {
    this.shouldScrollToBottom = true;
    this.filterMessages();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  toggleSearch(): void {
    this.showSearch = !this.showSearch;
    if (!this.showSearch) {
      this.searchQuery = '';
      this.filterMessages();
    }
  }

  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  insertEmoji(emoji: string): void {
    this.newMessage += emoji;
    this.showEmojiPicker = false;
  }

  onSearchMessages(): void {
    this.filterMessages();
  }

  private filterMessages(): void {
    if (!this.searchQuery.trim()) {
      this.filteredMessages = this.messages;
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredMessages = this.messages.filter(msg => 
        msg.content.toLowerCase().includes(query)
      );
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      // TODO: Implémenter l'upload de fichier
      console.log('File selected:', file.name);
    }
  }

  startVoiceRecording(): void {
    this.isRecording = !this.isRecording;
    if (this.isRecording) {
      console.log('🎤 Recording started...');
      // TODO: Implémenter l'enregistrement vocal
    } else {
      console.log('🎤 Recording stopped');
    }
  }

  onReact(data: { messageId: number, reaction: string }): void {
    console.log('React to message:', data);
    // TODO: Implémenter les réactions
  }

  getConversationTitle(): string {
    if (!this.conversation) {
      return 'Chargement...';
    }
    
    if (this.conversation.title) {
      return this.conversation.title;
    }
    
    const otherParticipant = this.conversation.participants.find(
      p => p.userId !== this.currentUserId
    );
    
    return otherParticipant?.userName || 'Conversation';
  }

  getConversationAvatar(): string {
    if (!this.conversation) {
      return 'https://ui-avatars.com/api/?name=...&background=2D5757&color=fff';
    }
    
    // Pour les groupes, utiliser une icône de groupe
    if (this.conversation.type === 'GROUP') {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.conversation.title || 'Groupe')}&background=667eea&color=fff&bold=true&size=128`;
    }
    
    const otherParticipant = this.conversation.participants.find(
      p => p.userId !== this.currentUserId
    );
    
    if (otherParticipant?.userAvatar && otherParticipant.userAvatar.trim() !== '') {
      // Si l'URL commence par http, c'est une URL complète (Google, etc.)
      if (otherParticipant.userAvatar.startsWith('http')) {
        return otherParticipant.userAvatar;
      }
      // Sinon, c'est un chemin relatif - utiliser l'API Gateway
      if (!otherParticipant.userAvatar.includes('ui-avatars.com')) {
        return `http://localhost:8080${otherParticipant.userAvatar}`;
      }
      return otherParticipant.userAvatar;
    }
    
    // Fallback sur ui-avatars
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.getConversationTitle())}&background=2D5757&color=fff`;
  }

  isOnline(): boolean {
    if (!this.conversation) {
      return false;
    }
    
    const otherParticipant = this.conversation.participants.find(
      p => p.userId !== this.currentUserId
    );
    
    return otherParticipant?.isOnline || false;
  }

  sendMessage(): void {
    if (this.newMessage.trim()) {
      this.messageSent.emit(this.newMessage);
      this.newMessage = '';
      this.shouldScrollToBottom = true;
      this.typing.emit(false);
    }
  }

  onTyping(): void {
    // Clear previous timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Send typing indicator
    this.typing.emit(true);

    // Stop typing after 2 seconds of inactivity
    this.typingTimeout = setTimeout(() => {
      this.typing.emit(false);
    }, 2000);
  }

  onScroll(event: any): void {
    const element = event.target;
    // Check if scrolled to top
    if (element.scrollTop === 0) {
      this.loadMore.emit();
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  trackByMessageId(index: number, message: Message): number {
    return message.id;
  }
}
