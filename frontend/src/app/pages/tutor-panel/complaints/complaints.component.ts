import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ComplaintService, ComplaintWithUser, ComplaintWorkflow } from '../../../core/services/complaint.service';
import { AuthService } from '../../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-tutor-complaints',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './complaints.component.html',
  styleUrls: ['./complaints.component.css']
})
export class ComplaintsComponent implements OnInit {
  complaints: ComplaintWithUser[] = [];
  filteredComplaints: ComplaintWithUser[] = [];
  selectedComplaint: ComplaintWithUser | null = null;
  complaintHistory: ComplaintWorkflow[] = [];
  
  isLoading = false;
  showDetailModal = false;
  showHistoryModal = false;
  showResponseModal = false;
  
  // Filters
  filterView: 'all' | 'critical' | 'overdue' = 'all';
  filterStatus: string = 'all';
  filterPriority: string = 'all';
  searchTerm: string = '';
  
  // Response form
  responseText: string = '';
  newStatus: string = '';
  
  // Stats
  stats = {
    total: 0,
    open: 0,
    noted: 0,
    inProgress: 0,
    resolved: 0,
    urgent: 0,
    overdue: 0
  };

  constructor(
    private complaintService: ComplaintService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadComplaints();
  }

  loadComplaints(): void {
    this.isLoading = true;
    
    const loadMethod = this.filterView === 'critical' 
      ? this.complaintService.getCriticalComplaints()
      : this.filterView === 'overdue'
      ? this.complaintService.getOverdueComplaints()
      : this.complaintService.getComplaintsForTutor(); // Use tutor-specific method
    
    loadMethod.subscribe({
      next: (data) => {
        this.complaints = data;
        this.applyFilters();
        this.calculateStats();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading complaints:', error);
        Swal.fire('Error', 'Failed to load complaints', 'error');
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredComplaints = this.complaints.filter(c => {
      const matchStatus = this.filterStatus === 'all' || c.status === this.filterStatus;
      const matchPriority = this.filterPriority === 'all' || c.priority === this.filterPriority;
      const matchSearch = !this.searchTerm || 
        (c.username?.toLowerCase().includes(this.searchTerm.toLowerCase()) || false) ||
        (c.subject?.toLowerCase().includes(this.searchTerm.toLowerCase()) || false) ||
        (c.userEmail?.toLowerCase().includes(this.searchTerm.toLowerCase()) || false);
      
      return matchStatus && matchPriority && matchSearch;
    });
  }

  calculateStats(): void {
    this.stats.total = this.complaints.length;
    this.stats.open = this.complaints.filter(c => c.status === 'OPEN').length;
    this.stats.noted = this.complaints.filter(c => c.status === 'NOTED').length;
    this.stats.inProgress = this.complaints.filter(c => c.status === 'IN_PROGRESS').length;
    this.stats.resolved = this.complaints.filter(c => c.status === 'RESOLVED').length;
    this.stats.urgent = this.complaints.filter(c => c.priority === 'URGENT').length;
    this.stats.overdue = this.complaints.filter(c => c.isOverdue).length;
  }

  changeView(view: 'all' | 'critical' | 'overdue'): void {
    this.filterView = view;
    this.loadComplaints();
  }

  viewDetails(complaint: ComplaintWithUser): void {
    this.router.navigate(['/tutor-panel/complaints', complaint.id]);
  }

  getSeverityBadge(priority: string | undefined): { text: string; class: string } {
    if (!priority) return { text: 'Medium', class: 'bg-yellow-500' };
    const badges: any = {
      'MEDIUM': { text: 'Medium', class: 'bg-yellow-500' },
      'HIGH': { text: 'High', class: 'bg-orange-500' },
      'URGENT': { text: 'Urgent', class: 'bg-red-500' }
    };
    return badges[priority] || badges['MEDIUM'];
  }

  getDaysOpenBadge(days: number | undefined): { text: string; class: string } {
    if (!days) return { text: '0 days waiting', class: 'bg-blue-500' };
    if (days >= 5) {
      return { text: `${days}d - Overdue`, class: 'bg-red-500' };
    } else if (days >= 2) {
      return { text: `${days}d - Delayed`, class: 'bg-orange-500' };
    }
    return { text: `${days}d waiting`, class: 'bg-blue-500' };
  }

  viewHistory(complaint: ComplaintWithUser): void {
    this.selectedComplaint = complaint;
    this.isLoading = true;
    
    this.complaintService.getComplaintHistory(complaint.id!).subscribe({
      next: (history) => {
        this.complaintHistory = history;
        this.showHistoryModal = true;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading history:', error);
        Swal.fire('Error', 'Failed to load complaint history', 'error');
        this.isLoading = false;
      }
    });
  }

  openResponseModal(complaint: ComplaintWithUser): void {
    this.selectedComplaint = complaint;
    this.responseText = complaint.response || '';
    this.newStatus = complaint.status || 'OPEN';
    this.showResponseModal = true;
  }

  submitResponse(): void {
    if (!this.selectedComplaint || !this.responseText.trim()) {
      Swal.fire('Error', 'Please provide a response', 'error');
      return;
    }

    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return;

    const data = {
      status: this.newStatus,
      actorId: currentUser.id,
      actorRole: 'TUTOR',
      response: this.responseText,
      comment: `Response added by ${currentUser.firstName} ${currentUser.lastName}`
    };

    this.complaintService.updateComplaintStatus(this.selectedComplaint.id!, data).subscribe({
      next: () => {
        Swal.fire('Success', 'Response submitted successfully', 'success');
        this.showResponseModal = false;
        this.responseText = '';
        this.loadComplaints();
      },
      error: (error) => {
        console.error('Error submitting response:', error);
        Swal.fire('Error', 'Failed to submit response', 'error');
      }
    });
  }

  getPriorityClass(priority: string | undefined): string {
    if (!priority) return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    const classes: any = {
      'URGENT': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'HIGH': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'MEDIUM': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'LOW': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    };
    return classes[priority] || 'bg-gray-100 text-gray-800';
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return 'bg-gray-100 text-gray-800';
    const classes: any = {
      'OPEN': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'NOTED': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
      'IN_PROGRESS': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'RESOLVED': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'REJECTED': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  closeModal(): void {
    this.showDetailModal = false;
    this.showHistoryModal = false;
    this.showResponseModal = false;
    this.selectedComplaint = null;
    this.responseText = '';
  }
}
