import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClubService } from '../../../core/services/club.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Club, ClubStatus } from '../../../core/models/club.model';

@Component({
  selector: 'app-club-requests-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './club-requests-admin.component.html',
  styleUrls: ['./club-requests-admin.component.scss']
})
export class ClubRequestsAdminComponent implements OnInit {
  allClubs: Club[] = [];
  pendingClubs: Club[] = [];
  approvedClubs: Club[] = [];
  rejectedClubs: Club[] = [];
  
  selectedTab: 'pending' | 'approved' | 'rejected' = 'pending';
  loading = false;
  error: string | null = null;
  
  // Modal pour approve/reject
  showReviewModal = false;
  selectedClub: Club | null = null;
  reviewComment = '';
  reviewAction: 'approve' | 'reject' | null = null;
  processing = false;

  ClubStatus = ClubStatus;

  constructor(
    private clubService: ClubService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.loadClubs();
  }

  loadClubs() {
    this.loading = true;
    this.error = null;

    this.clubService.getAllClubs().subscribe({
      next: (clubs) => {
        this.allClubs = clubs;
        this.categorizeClubs();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading clubs:', err);
        this.error = 'Failed to load club requests.';
        this.loading = false;
      }
    });
  }

  categorizeClubs() {
    this.pendingClubs = this.allClubs.filter(c => c.status === ClubStatus.PENDING);
    this.approvedClubs = this.allClubs.filter(c => c.status === ClubStatus.APPROVED);
    this.rejectedClubs = this.allClubs.filter(c => c.status === ClubStatus.REJECTED);
  }

  openReviewModal(club: Club, action: 'approve' | 'reject') {
    this.selectedClub = club;
    this.reviewAction = action;
    this.reviewComment = '';
    this.showReviewModal = true;
  }

  closeReviewModal() {
    this.showReviewModal = false;
    this.selectedClub = null;
    this.reviewAction = null;
    this.reviewComment = '';
  }

  confirmReview() {
    if (!this.selectedClub || !this.reviewAction) return;

    const currentUser = this.authService.currentUserValue;
    if (!currentUser) {
      this.notificationService.warning('Login Required', 'You must be logged in to review clubs');
      return;
    }

    this.processing = true;

    const reviewMethod = this.reviewAction === 'approve' 
      ? this.clubService.approveClub(this.selectedClub.id!, currentUser.id, this.reviewComment)
      : this.clubService.rejectClub(this.selectedClub.id!, currentUser.id, this.reviewComment);

    reviewMethod.subscribe({
      next: () => {
        this.processing = false;
        this.closeReviewModal();
        this.loadClubs();
        const action = this.reviewAction === 'approve' ? 'approved' : 'rejected';
        this.notificationService.success(`Club ${action.charAt(0).toUpperCase() + action.slice(1)}`, `Club has been ${action} successfully!`);
      },
      error: (err) => {
        this.notificationService.error(`${this.reviewAction === 'approve' ? 'Approval' : 'Rejection'} Failed`, `Failed to ${this.reviewAction} club. Please try again.`);
        this.processing = false;
      }
    });
  }

  getCategoryBadgeClass(category: string): string {
    const classes: { [key: string]: string } = {
      'CONVERSATION': 'text-blue-800 bg-blue-100',
      'BOOK': 'text-green-800 bg-green-100',
      'DRAMA': 'text-orange-800 bg-orange-100',
      'WRITING': 'text-purple-800 bg-purple-100',
      'GRAMMAR': 'text-indigo-800 bg-indigo-100',
      'VOCABULARY': 'text-pink-800 bg-pink-100'
    };
    return classes[category] || 'text-gray-800 bg-gray-100';
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
