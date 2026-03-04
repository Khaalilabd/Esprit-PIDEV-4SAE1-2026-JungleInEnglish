import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactionService, ReactionType, ReactionCount } from '../../services/reaction.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-reaction-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reaction-bar.component.html',
  styleUrl: './reaction-bar.component.scss'
})
export class ReactionBarComponent implements OnInit {
  @Input() targetId!: number;
  @Input() targetType: 'topic' | 'post' = 'topic';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  reactions: ReactionCount[] = [];
  userReaction: ReactionType | null = null;
  loading = false;

  private reactionService = inject(ReactionService);
  private authService = inject(AuthService);

  // Available reaction types
  reactionTypes = [
    { type: ReactionType.LIKE, icon: 'fas fa-thumbs-up', label: 'Like' },
    { type: ReactionType.HELPFUL, icon: 'fas fa-lightbulb', label: 'Helpful' },
    { type: ReactionType.INSIGHTFUL, icon: 'fas fa-hands-helping', label: 'Insightful' }
  ];

  ngOnInit(): void {
    this.loadReactions();
    this.loadUserReaction();
  }

  loadReactions(): void {
    const getReactionsMethod = this.targetType === 'topic'
      ? this.reactionService.getTopicReactions(this.targetId)
      : this.reactionService.getPostReactions(this.targetId);
    
    getReactionsMethod.subscribe({
      next: (reactions) => {
        this.reactions = reactions || [];
      },
      error: (err) => {
        console.error('Error loading reactions:', err);
        this.reactions = [];
      }
    });
  }
  
  loadUserReaction(): void {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return;
    
    const getUserReactionMethod = this.targetType === 'topic'
      ? this.reactionService.getUserReactionForTopic(this.targetId, currentUser.id)
      : this.reactionService.getUserReactionForPost(this.targetId, currentUser.id);
    
    getUserReactionMethod.subscribe({
      next: (reaction) => {
        if (reaction && reaction.type) {
          this.userReaction = reaction.type;
        } else {
          this.userReaction = null;
        }
      },
      error: (err) => {
        // 204 No Content or 404 is expected when user hasn't reacted
        if (err.status === 204 || err.status === 404) {
          this.userReaction = null;
        } else {
          console.error('Error loading user reaction:', err);
          this.userReaction = null;
        }
      }
    });
  }

  toggleReaction(type: ReactionType): void {
    if (this.loading) return;

    const currentUser = this.authService.currentUserValue;
    if (!currentUser) {
      console.error('User not authenticated');
      return;
    }

    this.loading = true;

    // If user already reacted with this type, remove it
    if (this.userReaction === type) {
      this.removeReaction();
    } else if (this.userReaction) {
      // User already reacted with a different type, change the reaction
      this.changeReaction(type);
    } else {
      // User hasn't reacted yet, add new reaction
      this.addReaction(type);
    }
  }

  private changeReaction(newType: ReactionType): void {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return;

    const oldType = this.userReaction;

    // Remove old reaction and add new one
    const removeMethod = this.targetType === 'topic'
      ? this.reactionService.removeReactionFromTopic(this.targetId, currentUser.id)
      : this.reactionService.removeReactionFromPost(this.targetId, currentUser.id);

    removeMethod.subscribe({
      next: () => {
        // Update local count for old reaction
        if (oldType) {
          this.updateLocalReactionCount(oldType, -1);
        }
        
        // Now add the new reaction
        this.addReaction(newType);
      },
      error: (err) => {
        console.error('Error changing reaction:', err);
        this.loading = false;
        // Reload to get correct state from server
        this.loadReactions();
        this.loadUserReaction();
      }
    });
  }

  private addReaction(type: ReactionType): void {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return;

    const addMethod = this.targetType === 'topic'
      ? this.reactionService.addReactionToTopic(this.targetId, type, currentUser.id)
      : this.reactionService.addReactionToPost(this.targetId, type, currentUser.id);

    addMethod.subscribe({
      next: () => {
        this.userReaction = type;
        this.updateLocalReactionCount(type, 1);
        this.loading = false;
        
        // Reload to ensure sync with server
        setTimeout(() => {
          this.loadReactions();
        }, 100);
      },
      error: (err) => {
        console.error('Error adding reaction:', err);
        this.loading = false;
        // Reload to get correct state from server
        this.loadReactions();
        this.loadUserReaction();
      }
    });
  }

  private removeReaction(): void {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return;

    console.log(`Removing reaction for ${this.targetType} ${this.targetId}, user ${currentUser.id}`);

    const removeMethod = this.targetType === 'topic'
      ? this.reactionService.removeReactionFromTopic(this.targetId, currentUser.id)
      : this.reactionService.removeReactionFromPost(this.targetId, currentUser.id);

    const previousReaction = this.userReaction;
    
    removeMethod.subscribe({
      next: () => {
        console.log('Reaction removed successfully from backend');
        
        // Immediately set to null
        this.userReaction = null;
        
        if (previousReaction) {
          this.updateLocalReactionCount(previousReaction, -1);
        }
        
        // Force reload from server to verify deletion
        this.loadReactions();
        this.loadUserReaction();
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error removing reaction:', err);
        console.error('Error status:', err.status);
        console.error('Error message:', err.message);
        this.loading = false;
        // Reload to get correct state from server
        this.loadReactions();
        this.loadUserReaction();
      }
    });
  }

  private updateLocalReactionCount(type: ReactionType, delta: number): void {
    if (!Array.isArray(this.reactions)) {
      this.reactions = [];
    }
    
    const existingReaction = this.reactions.find(r => r.type === type);
    
    if (existingReaction) {
      existingReaction.count += delta;
      if (existingReaction.count <= 0) {
        this.reactions = this.reactions.filter(r => r.type !== type);
      }
    } else if (delta > 0) {
      this.reactions.push({ type, count: delta });
    }
  }

  getReactionCount(type: ReactionType): number {
    if (!Array.isArray(this.reactions)) {
      return 0;
    }
    const reaction = this.reactions.find(r => r.type === type);
    return reaction ? reaction.count : 0;
  }

  hasReacted(type: ReactionType): boolean {
    return this.userReaction === type;
  }

  getTotalReactions(): number {
    if (!Array.isArray(this.reactions)) {
      return 0;
    }
    return this.reactions.reduce((sum, r) => sum + r.count, 0);
  }

  hasMoreReactions(currentType: ReactionType): boolean {
    if (!Array.isArray(this.reactions)) {
      return false;
    }
    // Check if there are more reactions after this type
    const currentIndex = this.reactionTypes.findIndex(r => r.type === currentType);
    for (let i = currentIndex + 1; i < this.reactionTypes.length; i++) {
      if (this.getReactionCount(this.reactionTypes[i].type) > 0) {
        return true;
      }
    }
    return false;
  }
}
