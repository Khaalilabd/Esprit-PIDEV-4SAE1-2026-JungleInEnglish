import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ExamService } from '../../../core/services/exam.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-exam-results-monitoring',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exam-results-monitoring.component.html',
  styleUrl: './exam-results-monitoring.component.scss'
})
export class ExamResultsMonitoringComponent implements OnInit {
  attempts: any[] = [];
  filteredAttempts: any[] = [];
  selectedAttempt: any = null;
  attemptDetails: any = null;
  loading = false;

  filterStatus = 'ALL';
  searchTerm = '';
  
  // Expose Math to template
  Math = Math;
  
  stats = {
    total: 0,
    submitted: 0,
    graded: 0,
    pending: 0,
    passRate: 0
  };

  constructor(
    private examService: ExamService,
    private router: Router,
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadAllAttempts();
  }

  loadAllAttempts(): void {
    this.loading = true;
    this.examService.getAllSubmittedAttempts().subscribe({
      next: (attempts) => {
        this.attempts = attempts.sort((a, b) => {
          const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
          const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
          return dateB - dateA;
        });
        // Load user details for each attempt
        this.attempts.forEach(attempt => {
          this.loadUserDetails(attempt);
        });
        this.applyFilters();
        this.calculateStats();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading attempts:', error);
        this.loading = false;
      }
    });
  }

  loadUserDetails(attempt: any): void {
    this.userService.getUserById(attempt.userId).subscribe({
      next: (user: any) => {
        attempt.userDetails = user;
      },
      error: (error: any) => {
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

  calculateStats(): void {
    this.stats.total = this.attempts.length;
    this.stats.submitted = this.attempts.filter(a => a.status === 'SUBMITTED').length;
    this.stats.graded = this.attempts.filter(a => a.status === 'GRADED').length;
    this.stats.pending = this.stats.submitted;
    
    const gradedAttempts = this.attempts.filter(a => a.status === 'GRADED');
    if (gradedAttempts.length > 0) {
      const passed = gradedAttempts.filter(a => a.passed).length;
      this.stats.passRate = Math.round((passed / gradedAttempts.length) * 100);
    }
  }

  applyFilters(): void {
    let filtered = [...this.attempts];

    // Status filter
    if (this.filterStatus !== 'ALL') {
      filtered = filtered.filter(a => a.status === this.filterStatus);
    }

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(a => 
        a.userId.toString().includes(term) ||
        a.id.toLowerCase().includes(term)
      );
    }

    this.filteredAttempts = filtered;
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  viewDetails(attempt: any): void {
    this.selectedAttempt = attempt;
    this.loadAttemptDetails(attempt.id, attempt.userId);
  }

  loadAttemptDetails(attemptId: string, userId: number): void {
    this.examService.getAttempt(attemptId, userId).subscribe({
      next: (details) => {
        this.attemptDetails = details;
      },
      error: (error) => {
        console.error('Error loading attempt details:', error);
      }
    });
  }

  backToList(): void {
    this.selectedAttempt = null;
    this.attemptDetails = null;
  }

  exportToCSV(): void {
    const csv = this.generateCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exam-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  generateCSV(): string {
    const headers = ['Attempt ID', 'User ID', 'Status', 'Submitted At', 'Score', 'Percentage', 'Passed'];
    const rows = this.filteredAttempts.map(a => [
      a.id,
      a.userId,
      a.status,
      new Date(a.submittedAt).toLocaleString(),
      a.totalScore || 'N/A',
      a.percentageScore ? `${a.percentageScore}%` : 'N/A',
      a.passed !== null ? (a.passed ? 'Yes' : 'No') : 'N/A'
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  getStatusBadgeClass(status: string): string {
    const classes: any = {
      'SUBMITTED': 'badge-warning',
      'GRADED': 'badge-success',
      'IN_PROGRESS': 'badge-info'
    };
    return classes[status] || 'badge-secondary';
  }

  getStatusIcon(status: string): string {
    const icons: any = {
      'SUBMITTED': 'bi-hourglass-split',
      'GRADED': 'bi-check-circle-fill',
      'IN_PROGRESS': 'bi-arrow-repeat'
    };
    return icons[status] || 'bi-question-circle';
  }

  getStudentAnswer(questionId: string): any {
    if (!this.attemptDetails || !this.attemptDetails.answers) {
      return null;
    }
    return this.attemptDetails.answers.find((a: any) => a.questionId === questionId);
  }

  parseAnswerData(answerData: string): string {
    if (!answerData) return '';
    
    try {
      const parsed = JSON.parse(answerData);
      if (Array.isArray(parsed)) {
        return parsed[0] || '';
      }
      if (typeof parsed === 'boolean') {
        return parsed.toString();
      }
      if (typeof parsed === 'string') {
        return parsed;
      }
      return JSON.stringify(parsed);
    } catch {
      return answerData;
    }
  }

  getSelectedOptionLabel(question: any, answerData: string): string {
    try {
      let selectedId = answerData;
      try {
        const parsed = JSON.parse(answerData);
        if (Array.isArray(parsed)) {
          selectedId = parsed[0];
        } else {
          selectedId = parsed;
        }
      } catch {}
      
      const option = question.options?.find((opt: any) => opt.id === selectedId);
      return option ? option.label : selectedId;
    } catch (error) {
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
      
      let metadata = question.metadata;
      if (typeof metadata === 'string') {
        metadata = JSON.parse(metadata);
      }
      
      if (metadata.correctAnswer) {
        return metadata.correctAnswer;
      }
      
      return 'N/A';
    } catch (error) {
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
      if (answerData === 'true') {
        return 'True';
      }
      return 'False';
    }
  }
}
