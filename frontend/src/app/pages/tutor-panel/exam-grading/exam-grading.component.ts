import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ExamService } from '../../../core/services/exam.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-exam-grading',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exam-grading.component.html',
  styleUrl: './exam-grading.component.scss'
})
export class ExamGradingComponent implements OnInit {
  attempts: any[] = [];
  selectedAttempt: any = null;
  attemptDetails: any = null;
  loading = false;
  grading = false;
  isReadOnly = false;
  
  filterStatus = 'SUBMITTED';
  
  // Toast notification
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  
  // Expose Math to template
  Math = Math;
  
  constructor(
    private examService: ExamService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAttempts();
  }

  loadAttempts(): void {
    this.loading = true;
    
    if (this.filterStatus === 'ALL') {
      // Load both submitted and graded
      this.examService.getAttemptsByStatus('SUBMITTED').subscribe({
        next: (submitted) => {
          this.examService.getAttemptsByStatus('GRADED').subscribe({
            next: (graded) => {
              this.attempts = [...submitted, ...graded];
              this.attempts.forEach(attempt => {
                this.loadUserDetails(attempt);
              });
              this.loading = false;
            },
            error: (error) => {
              console.error('Error loading graded attempts:', error);
              this.attempts = submitted;
              this.attempts.forEach(attempt => {
                this.loadUserDetails(attempt);
              });
              this.loading = false;
            }
          });
        },
        error: (error) => {
          console.error('Error loading submitted attempts:', error);
          this.loading = false;
        }
      });
    } else {
      this.examService.getAttemptsByStatus(this.filterStatus).subscribe({
        next: (attempts) => {
          this.attempts = attempts;
          // Fetch user details for each attempt
          this.attempts.forEach(attempt => {
            this.loadUserDetails(attempt);
          });
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading attempts:', error);
          this.loading = false;
        }
      });
    }
  }

  loadUserDetails(attempt: any): void {
    this.authService.getUserById(attempt.userId).subscribe({
      next: (user) => {
        attempt.userDetails = user;
      },
      error: (error) => {
        console.error('Error loading user details:', error);
        attempt.userDetails = {
          firstName: 'Unknown',
          lastName: 'User',
          profilePicture: null
        };
      }
    });
  }

  getUserInitials(attempt: any): string {
    if (!attempt.userDetails) return '?';
    const first = attempt.userDetails.firstName?.charAt(0) || '';
    const last = attempt.userDetails.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  }

  getUserFullName(attempt: any): string {
    if (!attempt.userDetails) return 'Loading...';
    return `${attempt.userDetails.firstName || ''} ${attempt.userDetails.lastName || ''}`.trim() || 'Unknown User';
  }

  getProfilePicture(attempt: any): string | null {
    return attempt.userDetails?.profilePicture || null;
  }

  getTimeAgo(date: string): string {
    const now = new Date();
    const submitted = new Date(date);
    const diffMs = now.getTime() - submitted.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return submitted.toLocaleDateString();
  }

  viewAttempt(attempt: any): void {
    this.selectedAttempt = attempt;
    this.isReadOnly = attempt.status === 'GRADED';
    this.loadAttemptDetails(attempt.id);
  }

  loadAttemptDetails(attemptId: string): void {
    const userId = this.selectedAttempt.userId;
    this.examService.getAttempt(attemptId, userId).subscribe({
      next: (details) => {
        this.attemptDetails = details;
      },
      error: (error) => {
        console.error('Error loading attempt details:', error);
      }
    });
  }

  gradeAnswer(answerId: string, score: number, feedback: string): void {
    if (!answerId) {
      this.showToastNotification('Answer ID is missing', 'error');
      return;
    }

    const graderId = 1; // TODO: Get from auth service
    const gradeData = {
      score: score,
      feedback: feedback
    };

    this.grading = true;
    this.examService.gradeAnswer(answerId, graderId, gradeData).subscribe({
      next: () => {
        this.showToastNotification('Grade saved', 'success');
        this.loadAttemptDetails(this.selectedAttempt.id);
        this.grading = false;
      },
      error: (error) => {
        console.error('Error grading answer:', error);
        this.showToastNotification('Failed to save grade', 'error');
        this.grading = false;
      }
    });
  }

  getStudentAnswer(questionId: string): any {
    if (!this.attemptDetails || !this.attemptDetails.answers) {
      return null;
    }
    return this.attemptDetails.answers.find((a: any) => a.questionId === questionId);
  }

  finalizeGrading(): void {
    if (!confirm('Finalize grading for this exam? This will calculate the final score.')) {
      return;
    }

    this.examService.finalizeGrading(this.selectedAttempt.id).subscribe({
      next: () => {
        this.showToastNotification('Grading finalized successfully!', 'success');
        this.selectedAttempt = null;
        this.attemptDetails = null;
        this.loadAttempts();
      },
      error: (error) => {
        console.error('Error finalizing grading:', error);
        this.showToastNotification('Failed to finalize grading', 'error');
      }
    });
  }

  showToastNotification(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  backToList(): void {
    this.selectedAttempt = null;
    this.attemptDetails = null;
    this.isReadOnly = false;
  }

  getStatusBadgeClass(status: string): string {
    const classes: any = {
      'SUBMITTED': 'badge-warning',
      'GRADED': 'badge-success',
      'IN_PROGRESS': 'badge-info'
    };
    return classes[status] || 'badge-secondary';
  }

  parseAnswerData(answerData: string): string {
    if (!answerData) return '';
    
    try {
      const parsed = JSON.parse(answerData);
      
      // Handle array format (MCQ returns ["option-id"])
      if (Array.isArray(parsed)) {
        return parsed[0] || '';
      }
      
      // Handle object with value property
      if (typeof parsed === 'object' && parsed.value !== undefined) {
        return parsed.value;
      }
      
      // Handle boolean
      if (typeof parsed === 'boolean') {
        return parsed.toString();
      }
      
      // Handle string
      if (typeof parsed === 'string') {
        return parsed;
      }
      
      return JSON.stringify(parsed);
    } catch {
      // If not JSON, return as is
      return answerData;
    }
  }

  getSelectedOptionLabel(question: any, answerData: string): string {
    try {
      // Parse the answer data to get the option ID
      let selectedId = answerData;
      
      // If it's JSON, parse it
      try {
        const parsed = JSON.parse(answerData);
        // Handle array format ["option-id"]
        if (Array.isArray(parsed)) {
          selectedId = parsed[0];
        } else {
          selectedId = parsed;
        }
      } catch {
        // Not JSON, use as is
      }
      
      // Find the option with this ID
      const option = question.options?.find((opt: any) => opt.id === selectedId);
      return option ? option.label : selectedId;
    } catch (error) {
      console.error('Error getting selected option:', error);
      return answerData;
    }
  }

  getCorrectOptionLabel(question: any): string {
    if (!question.options || question.options.length === 0) {
      return 'N/A';
    }
    const correctOption = question.options.find((opt: any) => opt.isCorrect === true);
    return correctOption ? correctOption.label : 'N/A';
  }

  getCorrectAnswer(question: any): string {
    try {
      if (!question.metadata) {
        return 'N/A';
      }
      
      // Handle if metadata is a string (needs parsing)
      let metadata = question.metadata;
      if (typeof metadata === 'string') {
        metadata = JSON.parse(metadata);
      }
      
      if (metadata.correctAnswer) {
        return metadata.correctAnswer;
      }
      
      return 'N/A';
    } catch (error) {
      console.error('Error parsing metadata:', error);
      return 'N/A';
    }
  }

  getTrueFalseDisplay(answerData: string): string {
    try {
      const parsed = JSON.parse(answerData);
      if (parsed === true || parsed === 'true') {
        return 'True';
      }
      return 'False';
    } catch {
      // If not JSON, check string value
      if (answerData === 'true') {
        return 'True';
      }
      return 'False';
    }
  }
}
