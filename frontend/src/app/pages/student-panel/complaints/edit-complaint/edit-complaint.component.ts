import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ComplaintService } from '../../../../core/services/complaint.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-edit-complaint',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-complaint.component.html',
  styleUrls: ['./edit-complaint.component.css']
})
export class EditComplaintComponent implements OnInit {
  complaintId: number | null = null;
  complaint: any = null;
  messages: any[] = [];
  isLoading = true;
  isSubmitting = false;

  editForm = {
    subject: '',
    description: '',
    status: '',
    response: ''
  };

  statuses = [
    { value: 'OPEN', label: 'Open', color: 'bg-blue-100 text-blue-700' },
    { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'RESOLVED', label: 'Resolved', color: 'bg-green-100 text-green-700' },
    { value: 'REJECTED', label: 'Rejected', color: 'bg-red-100 text-red-700' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private complaintService: ComplaintService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.complaintId = +params['id'];
      if (this.complaintId) {
        this.loadComplaint();
      }
    });
  }

  loadComplaint(): void {
    if (!this.complaintId) return;

    this.complaintService.getComplaintById(this.complaintId).subscribe({
      next: (data) => {
        this.complaint = data;
        this.editForm = {
          subject: data.subject || '',
          description: data.description || '',
          status: data.status || 'OPEN',
          response: data.response || ''
        };
        
        // Load messages
        this.loadMessages();
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading complaint:', error);
        this.isLoading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Unable to load complaint.',
          confirmButtonColor: '#F59E0B'
        }).then(() => {
          this.router.navigate(['/user-panel/complaints']);
        });
      }
    });
  }

  loadMessages(): void {
    if (!this.complaintId) return;

    this.complaintService.getMessages(this.complaintId).subscribe({
      next: (messages) => {
        this.messages = messages;
      },
      error: (error) => {
        console.error('Error loading messages:', error);
      }
    });
  }

  updateComplaint(): void {
    if (!this.complaintId) return;

    this.isSubmitting = true;

    // Students can only update subject and description
    const updateData: any = {
      userId: this.complaint.userId,
      title: this.editForm.subject,
      category: this.complaint.category,
      subject: this.editForm.subject,
      description: this.editForm.description
      // Status and response are NOT included - only managers can update these
    };

    this.complaintService.updateComplaint(this.complaintId, updateData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Your complaint has been updated successfully.',
          confirmButtonColor: '#F59E0B',
          timer: 2000,
          timerProgressBar: true
        }).then(() => {
          this.router.navigate(['/user-panel/complaints']);
        });
      },
      error: (error) => {
        console.error('Error updating complaint:', error);
        this.isSubmitting = false;
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Unable to update complaint. Please try again.',
          confirmButtonColor: '#F59E0B'
        });
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/user-panel/complaints']);
  }

  getStatusClass(status: string): string {
    const statusObj = this.statuses.find(s => s.value === status);
    return statusObj ? statusObj.color : 'bg-gray-100 text-gray-700';
  }

  getPriorityClass(priority: string): string {
    const classes: any = {
      'LOW': 'bg-gray-100 text-gray-700',
      'MEDIUM': 'bg-blue-100 text-blue-700',
      'HIGH': 'bg-orange-100 text-orange-700',
      'URGENT': 'bg-red-100 text-red-700'
    };
    return classes[priority] || 'bg-gray-100 text-gray-700';
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric',
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
