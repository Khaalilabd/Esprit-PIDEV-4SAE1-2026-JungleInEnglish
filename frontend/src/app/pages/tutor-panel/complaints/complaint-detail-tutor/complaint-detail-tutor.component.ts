import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ComplaintService, ComplaintWithUser, ComplaintWorkflow } from '../../../../core/services/complaint.service';
import { AuthService } from '../../../../core/services/auth.service';
import Swal from 'sweetalert2';

interface ComplaintMessage {
  id?: number;
  author: string;
  authorRole: string;
  content: string;
  timestamp: Date;
  isAdmin: boolean;
}

@Component({
  selector: 'app-complaint-detail-tutor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './complaint-detail-tutor.component.html',
  styleUrls: ['./complaint-detail-tutor.component.css']
})
export class ComplaintDetailTutorComponent implements OnInit {
  complaint: ComplaintWithUser | null = null;
  complaintHistory: ComplaintWorkflow[] = [];
  messages: ComplaintMessage[] = [];
  
  isLoading = false;
  
  // New message
  newMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private complaintService: ComplaintService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadComplaintDetails(+id);
    }
  }

  loadComplaintDetails(id: number): void {
    this.isLoading = true;
    
    this.complaintService.getComplaintById(id).subscribe({
      next: (data: any) => {
        this.complaint = data;
        
        // Calculate daysSinceCreation if not present
        if (this.complaint && this.complaint.createdAt && !this.complaint.daysSinceCreation) {
          const createdDate = new Date(this.complaint.createdAt);
          const now = new Date();
          const diffTime = Math.abs(now.getTime() - createdDate.getTime());
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          this.complaint.daysSinceCreation = diffDays;
        }
        
        this.loadHistory(id);
        this.loadMessages(id);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading complaint:', error);
        Swal.fire('Error', 'Failed to load complaint details', 'error');
        this.isLoading = false;
      }
    });
  }

  loadHistory(id: number): void {
    this.complaintService.getComplaintHistory(id).subscribe({
      next: (history) => {
        this.complaintHistory = history;
      },
      error: (error) => {
        console.error('Error loading history:', error);
      }
    });
  }

  loadMessages(id: number): void {
    this.complaintService.getMessages(id).subscribe({
      next: (messages) => {
        this.messages = messages.map(m => ({
          id: m.id,
          author: m.author || 'Unknown',  // Utiliser 'author' au lieu de 'senderName'
          authorRole: m.authorRole,
          content: m.content,
          timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
          isAdmin: m.authorRole !== 'STUDENT'
        }));
      },
      error: (error) => {
        console.error('Error loading messages:', error);
      }
    });
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.complaint || !this.complaint.id) return;

    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return;

    const messageData = {
      authorId: currentUser.id,
      authorRole: 'TUTOR',
      content: this.newMessage
    };

    this.complaintService.sendMessage(this.complaint.id, messageData).subscribe({
      next: (message) => {
        // Use current user's name instead of "You"
        const authorName = currentUser.firstName && currentUser.lastName 
          ? `${currentUser.firstName} ${currentUser.lastName}`
          : (message.author || 'You');
          
        this.messages.push({
          id: message.id,
          author: authorName,
          authorRole: message.authorRole,
          content: message.content,
          timestamp: message.timestamp ? new Date(message.timestamp) : new Date(),
          isAdmin: true
        });
        this.newMessage = '';
      },
      error: (error) => {
        console.error('Error sending message:', error);
        Swal.fire('Error', 'Failed to send message', 'error');
      }
    });
  }

  markAsNoted(): void {
    if (!this.complaint) {
      console.log('❌ No complaint');
      return;
    }

    const currentUser = this.authService.currentUserValue;
    if (!currentUser) {
      console.log('❌ No current user');
      return;
    }

    console.log('🔔 Opening confirmation dialog for complaint:', this.complaint.id);

    Swal.fire({
      title: 'Mark as Noted?',
      text: 'This will acknowledge that you have noted this complaint.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, mark as noted',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      console.log('🔔 Dialog result:', result);
      
      if (result.isConfirmed && this.complaint) {
        const data = {
          status: 'NOTED',
          actorId: currentUser.id,
          actorRole: 'TUTOR',
          comment: `Tutor ${currentUser.firstName} ${currentUser.lastName} has noted this complaint`
        };

        console.log('🚀 Sending request to mark as noted:', data);
        console.log('🚀 Complaint ID:', this.complaint.id);

        this.complaintService.updateComplaintStatus(this.complaint.id!, data).subscribe({
          next: (response) => {
            console.log('✅ Success response:', response);
            Swal.fire('Success', 'Complaint marked as noted', 'success');
            if (this.complaint?.id) {
              this.loadComplaintDetails(this.complaint.id);
            }
          },
          error: (error) => {
            console.error('❌ Error marking as noted:', error);
            console.error('❌ Error details:', error.error);
            console.error('❌ Error status:', error.status);
            Swal.fire('Error', 'Failed to mark as noted', 'error');
          }
        });
      } else {
        console.log('❌ User cancelled or no complaint');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/tutor-panel/complaints']);
  }

  getPriorityClass(priority: string | undefined): string {
    if (!priority) return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    const classes: any = {
      'URGENT': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'HIGH': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'MEDIUM': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    };
    return classes[priority] || 'bg-gray-100 text-gray-800';
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return 'bg-gray-100 text-gray-800';
    const classes: any = {
      'OPEN': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'NOTED': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
      'IN_PROGRESS': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      'RESOLVED': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'PENDING_STUDENT_CONFIRMATION': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'REJECTED': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getSeverityBadge(priority: string | undefined): { text: string; class: string } {
    if (!priority) return { text: 'Medium Severity', class: 'bg-yellow-500' };
    const badges: any = {
      'MEDIUM': { text: 'Medium Severity', class: 'bg-yellow-500' },
      'HIGH': { text: 'High Severity', class: 'bg-orange-500' },
      'URGENT': { text: 'Urgent Severity', class: 'bg-red-500' }
    };
    return badges[priority] || badges['MEDIUM'];
  }

  getDaysOpenBadge(days: number | undefined): { text: string; class: string } {
    if (!days) return { text: '0 days waiting', class: 'bg-blue-500' };
    if (days >= 5) {
      return { text: `${days} days - Overdue`, class: 'bg-red-500' };
    } else if (days >= 2) {
      return { text: `${days} days - Delayed`, class: 'bg-orange-500' };
    }
    return { text: `${days} days waiting`, class: 'bg-blue-500' };
  }
}
