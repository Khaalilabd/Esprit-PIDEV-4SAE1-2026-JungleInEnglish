import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ComplaintService } from '../../../core/services/complaint.service';
import { AuthService } from '../../../core/services/auth.service';
import { ClubService } from '../../../core/services/club.service';
import { MemberService } from '../../../core/services/member.service';
import Swal from 'sweetalert2';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-complaints',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './complaints.component.html',
  styleUrls: ['./complaints.component.css']
})
export class ComplaintsComponent implements OnInit, OnDestroy {
  // Workflow steps
  currentStep = 0;
  
  // Form data
  complaintForm = {
    category: '',
    courseType: '',
    difficulty: '',
    issueType: '',
    sessionCount: null as number | null,
    subject: '',
    description: '',
    clubId: null as number | null,
    clubName: ''
  };
  
  // Categories
  categories = [
    { 
      value: 'PEDAGOGICAL', 
      label: 'Pedagogical Issue',
      description: 'I don\'t understand the course',
      icon: 'fa-book-open',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    { 
      value: 'TUTOR_BEHAVIOR', 
      label: 'Tutor Issue',
      description: 'Behavior or teaching method',
      icon: 'fa-chalkboard-teacher',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    { 
      value: 'SCHEDULE', 
      label: 'Schedule Issue',
      description: 'Absence or schedule change',
      icon: 'fa-calendar-times',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    { 
      value: 'CLUB_SUSPENSION', 
      label: 'Club Suspension Appeal',
      description: 'Contest club suspension decision',
      icon: 'fa-users-slash',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      isClubSuspension: true
    },
    { 
      value: 'TECHNICAL', 
      label: 'Technical Issue',
      description: 'Platform problem',
      icon: 'fa-laptop-code',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    { 
      value: 'ADMINISTRATIVE', 
      label: 'Administrative Issue',
      description: 'Payment or registration',
      icon: 'fa-file-invoice-dollar',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    }
  ];
  
  // Dynamic options based on category
  courseTypes = ['Speaking', 'Grammar', 'Listening', 'Writing', 'Vocabulary'];
  
  difficulties = [
    'Vocabulary too complex',
    'Difficult oral comprehension',
    'Teacher speaks too fast',
    'Lack of practical exercises',
    'Unclear explanations'
  ];
  
  tutorIssues = [
    'Frequent delays',
    'Unjustified absences',
    'Poor explanation',
    'Inappropriate behavior',
    'Lack of interaction'
  ];
  
  technicalIssues = [
    'Cannot login',
    'Video not loading',
    'Audio not working',
    'Platform blocked',
    'Payment error'
  ];
  
  // Club suspension reasons
  clubSuspensionReasons = [
    'Unjustified suspension',
    'Misunderstanding of club activities',
    'Violation not committed by our club',
    'Excessive penalty for minor infraction',
    'Lack of prior warning',
    'Other reason'
  ];
  
  // User's suspended clubs (for CLUB_SUSPENSION category)
  suspendedClubs: any[] = [];
  
  // Complaints list
  complaints: any[] = [];
  isLoading = false;
  isSubmitting = false;
  
  // Suggested solutions
  suggestedSolutions: any[] = [];
  
  // Polling interval for checking new responses
  private pollingInterval: any;

  constructor(
    private complaintService: ComplaintService,
    private authService: AuthService,
    private router: Router,
    private clubService: ClubService,
    private memberService: MemberService
  ) {}

  ngOnInit(): void {
    this.loadComplaints();
    this.loadSuspendedClubs();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  private startPolling(): void {
    // Check for new responses every 10 seconds
    this.pollingInterval = setInterval(() => {
      this.loadComplaintsQuietly();
    }, 10000);
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  private loadComplaintsQuietly(): void {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !currentUser.id) return;

    this.complaintService.getMyComplaints(currentUser.id).subscribe({
      next: (data) => {
        // Check if there are new responses
        const hasNewResponses = this.checkForNewResponses(data);
        this.complaints = data;
        
        if (hasNewResponses) {
          // Show a subtle notification
          this.showNewResponseNotification();
        }
      },
      error: (error) => {
        console.error('Error loading complaints:', error);
      }
    });
  }

  private checkForNewResponses(newComplaints: any[]): boolean {
    if (this.complaints.length === 0) return false;
    
    for (let newComplaint of newComplaints) {
      const oldComplaint = this.complaints.find(c => c.id === newComplaint.id);
      if (oldComplaint && !oldComplaint.response && newComplaint.response) {
        return true;
      }
      if (oldComplaint && oldComplaint.response !== newComplaint.response) {
        return true;
      }
    }
    return false;
  }

  private showNewResponseNotification(): void {
    // Show a toast notification
    const toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
    
    toast.fire({
      icon: 'info',
      title: 'New response received!'
    });
  }

  private loadComplaints(): void {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !currentUser.id) return;

    this.isLoading = true;
    this.complaintService.getMyComplaints(currentUser.id).subscribe({
      next: (data) => {
        this.complaints = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading complaints:', error);
        this.isLoading = false;
      }
    });
  }

  // Navigate steps
  nextStep(): void {
    if (this.currentStep < 3) {
      this.currentStep++;
      
      // Skip step 2 (suggested solutions) if not PEDAGOGICAL
      if (this.currentStep === 2 && this.complaintForm.category !== 'PEDAGOGICAL') {
        this.currentStep = 3; // Skip directly to step 3
      }
      
      // Check for suggested solutions at step 2 for PEDAGOGICAL
      if (this.currentStep === 2 && this.complaintForm.category === 'PEDAGOGICAL') {
        this.loadSuggestedSolutions();
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
      
      // Skip step 2 when going back if not PEDAGOGICAL
      if (this.currentStep === 2 && this.complaintForm.category !== 'PEDAGOGICAL') {
        this.currentStep = 1; // Go back to step 1
      }
    }
  }

  selectCategory(category: string): void {
    this.complaintForm.category = category;
    
    // Find the selected category object
    const selectedCategory = this.categories.find(c => c.value === category);
    
    // If CLUB_SUSPENSION, check if user has suspended clubs
    if (category === 'CLUB_SUSPENSION' && selectedCategory?.isClubSuspension) {
      if (this.suspendedClubs.length === 0) {
        Swal.fire({
          icon: 'info',
          title: 'No Suspended Clubs',
          text: 'You don\'t have any suspended clubs to appeal for.',
          confirmButtonColor: '#F59E0B'
        });
        this.complaintForm.category = '';
        return;
      }
    }
    
    this.nextStep();
  }
  
  onClubSelected(clubId: number): void {
    const selectedClub = this.suspendedClubs.find(c => c.id === clubId);
    if (selectedClub) {
      this.complaintForm.clubName = selectedClub.name;
    }
  }

  loadSuspendedClubs(): void {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !currentUser.id) return;

    // Get user's memberships
    this.memberService.getMembersByUser(currentUser.id).subscribe({
      next: (members) => {
        // Filter for President, Vice President, or Secretary roles
        const eligibleMembers = members.filter(m => 
          m.rank === 'PRESIDENT' || m.rank === 'VICE_PRESIDENT' || m.rank === 'SECRETARY'
        );
        
        if (eligibleMembers.length === 0) {
          return;
        }
        
        // Get club details for eligible memberships
        const clubRequests = eligibleMembers.map(m => this.clubService.getClubById(m.clubId));
        
        forkJoin(clubRequests).subscribe({
          next: (clubs) => {
            // Filter for suspended clubs
            this.suspendedClubs = clubs.filter(club => club.status === 'SUSPENDED');
            console.log('Suspended clubs:', this.suspendedClubs);
          },
          error: (error) => {
            console.error('Error loading clubs:', error);
          }
        });
      },
      error: (error) => {
        console.error('Error loading memberships:', error);
      }
    });
  }

  // Load suggested solutions for pedagogical issues
  loadSuggestedSolutions(): void {
    this.suggestedSolutions = [
      {
        title: 'Explanatory Video',
        description: 'Watch this video that explains the concept in detail',
        link: '#',
        icon: 'fa-video',
        color: 'text-red-600'
      },
      {
        title: 'Additional Exercises',
        description: 'Practice with these interactive exercises',
        link: '#',
        icon: 'fa-pen-fancy',
        color: 'text-blue-600'
      },
      {
        title: 'Review PDF',
        description: 'Download this comprehensive review guide',
        link: '#',
        icon: 'fa-file-pdf',
        color: 'text-orange-600'
      }
    ];
  }

  skipSolutions(): void {
    this.nextStep();
  }

  // Submit complaint
  submitComplaint(): void {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !currentUser.id) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please login to submit a complaint',
        confirmButtonColor: '#F59E0B'
      });
      return;
    }

    // Validation des champs
    const validationErrors = this.validateComplaintForm();
    if (validationErrors.length > 0) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        html: validationErrors.join('<br>'),
        confirmButtonColor: '#F59E0B'
      });
      return;
    }

    this.isSubmitting = true;

    // Determine targetRole based on category
    let targetRole = 'ACADEMIC_OFFICE_AFFAIR'; // Default to Academic Office Affair
    if (this.complaintForm.category === 'PEDAGOGICAL') {
      targetRole = 'TUTOR';
    }

    const complaintData: any = {
      userId: currentUser.id,
      targetRole: targetRole,
      category: this.complaintForm.category,
      subject: this.complaintForm.subject,
      description: this.complaintForm.description,
      courseType: this.complaintForm.courseType,
      difficulty: this.complaintForm.difficulty,
      issueType: this.complaintForm.issueType,
      sessionCount: this.complaintForm.sessionCount
    };
    
    // Add clubId for CLUB_SUSPENSION category
    if (this.complaintForm.category === 'CLUB_SUSPENSION' && this.complaintForm.clubId) {
      complaintData.clubId = this.complaintForm.clubId;
    }

    this.complaintService.createComplaint(complaintData).subscribe({
      next: (response: any) => {
        this.complaints.unshift(response);
        this.resetForm();
        this.isSubmitting = false;
        
        Swal.fire({
          icon: 'success',
          title: 'Complaint Sent!',
          html: `Your complaint has been sent to <strong>${this.getTargetRole(response.targetRole || 'MANAGER', response.category)}</strong><br>
                 Priority: <strong>${this.getPriorityLabel(response.priority || 'MEDIUM')}</strong>`,
          confirmButtonColor: '#F59E0B',
          timer: 4000,
          timerProgressBar: true
        });
      },
      error: (error) => {
        console.error('Error submitting complaint:', error);
        this.isSubmitting = false;
        
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Unable to send complaint. Please try again.',
          confirmButtonColor: '#F59E0B'
        });
      }
    });
  }

  resetForm(): void {
    this.currentStep = 0;
    this.complaintForm = {
      category: '',
      courseType: '',
      difficulty: '',
      issueType: '',
      sessionCount: null,
      subject: '',
      description: '',
      clubId: null,
      clubName: ''
    };
    this.suggestedSolutions = [];
  }

  getTargetRole(role: string, category?: string): string {
    // If category is PEDAGOGICAL, show "Your Tutor"
    if (category === 'PEDAGOGICAL') {
      return 'Your Tutor';
    }
    
    // For all other categories, show "Academic Office Affair"
    return 'Academic Office Affair';
  }

  getPriorityLabel(priority: string): string {
    const priorities: any = {
      'LOW': 'Low',
      'MEDIUM': 'Medium',
      'HIGH': 'High',
      'URGENT': 'Urgent'
    };
    return priorities[priority] || priority;
  }

  getStatusClass(status: string): string {
    const classes: any = {
      'OPEN': 'bg-blue-100 text-blue-700',
      'IN_PROGRESS': 'bg-indigo-100 text-indigo-700',
      'RESOLVED': 'bg-green-100 text-green-700',
      'REJECTED': 'bg-red-100 text-red-700'
    };
    return classes[status] || 'bg-gray-100 text-gray-700';
  }

  getPriorityClass(priority: string): string {
    const classes: any = {
      'MEDIUM': 'bg-yellow-100 text-yellow-700',
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

  getTimeAgo(dateString?: string): string {
    if (!dateString) return '';
    
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 30) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }

  trackByComplaintId(index: number, complaint: any): number {
    return complaint.id || index;
  }

  /**
   * Valider le formulaire de complaint avant soumission
   */
  validateComplaintForm(): string[] {
    const errors: string[] = [];

    // Validation du sujet
    if (!this.complaintForm.subject || this.complaintForm.subject.trim().length === 0) {
      errors.push('❌ Subject is required');
    } else if (this.complaintForm.subject.trim().length < 5) {
      errors.push('❌ Subject must be at least 5 characters long');
    } else if (this.complaintForm.subject.trim().length > 200) {
      errors.push('❌ Subject must not exceed 200 characters');
    }

    // Validation de la description
    if (!this.complaintForm.description || this.complaintForm.description.trim().length === 0) {
      errors.push('❌ Description is required');
    } else if (this.complaintForm.description.trim().length < 20) {
      errors.push('❌ Description must be at least 20 characters long');
    } else if (this.complaintForm.description.trim().length > 5000) {
      errors.push('❌ Description must not exceed 5000 characters');
    }

    // Validation spécifique pour CLUB_SUSPENSION
    if (this.complaintForm.category === 'CLUB_SUSPENSION') {
      if (!this.complaintForm.clubId) {
        errors.push('❌ Please select a suspended club');
      }
      if (!this.complaintForm.issueType) {
        errors.push('❌ Please select a reason for appeal');
      }
    }

    // Validation du sessionCount si fourni
    if (this.complaintForm.sessionCount !== null && this.complaintForm.sessionCount !== undefined) {
      if (this.complaintForm.sessionCount < 0) {
        errors.push('❌ Session count cannot be negative');
      }
      if (this.complaintForm.sessionCount > 1000) {
        errors.push('❌ Session count seems unrealistic (max 1000)');
      }
    }

    return errors;
  }

  /**
   * Vérifier si le formulaire peut passer à l'étape suivante
   */
  canProceedToNextStep(): boolean {
    if (this.currentStep === 1) {
      // Vérifier que les champs requis de l'étape 1 sont remplis
      if (this.complaintForm.category === 'PEDAGOGICAL') {
        return !!(this.complaintForm.courseType && this.complaintForm.difficulty);
      }
      if (this.complaintForm.category === 'TUTOR_BEHAVIOR') {
        return !!this.complaintForm.issueType;
      }
      if (this.complaintForm.category === 'SCHEDULE') {
        return !!(this.complaintForm.issueType && this.complaintForm.courseType);
      }
      if (this.complaintForm.category === 'TECHNICAL') {
        return !!(this.complaintForm.issueType && this.complaintForm.difficulty);
      }
      if (this.complaintForm.category === 'ADMINISTRATIVE') {
        return !!this.complaintForm.issueType;
      }
      if (this.complaintForm.category === 'CLUB_SUSPENSION') {
        return !!(this.complaintForm.clubId && this.complaintForm.issueType);
      }
    }
    return true;
  }

  getResponderInfo(complaint: any): string {
    if (!complaint.responderRole) return 'ACADEMIC_OFFICE_AFFAIR';
    
    // If responderName is available, use it
    if (complaint.responderName) {
      return `${complaint.responderName}`;
    }
    
    return complaint.responderRole;
  }

  // Navigate to complaint detail page
  viewComplaintDetails(id: number): void {
    this.router.navigate(['/user-panel/complaints', id]);
  }

  editComplaint(id: number): void {
    this.router.navigate(['/user-panel/complaints/edit', id]);
  }

  deleteComplaint(id: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#F59E0B',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.complaintService.deleteComplaint(id).subscribe({
          next: () => {
            this.complaints = this.complaints.filter(c => c.id !== id);
            
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: 'Your complaint has been deleted.',
              confirmButtonColor: '#F59E0B',
              timer: 2000,
              timerProgressBar: true,
              showConfirmButton: false
            });
          },
          error: (error) => {
            console.error('Error deleting complaint:', error);
            
            Swal.fire({
              icon: 'error',
              title: 'Error!',
              text: 'Unable to delete complaint.',
              confirmButtonColor: '#F59E0B'
            });
          }
        });
      }
    });
  }
}
