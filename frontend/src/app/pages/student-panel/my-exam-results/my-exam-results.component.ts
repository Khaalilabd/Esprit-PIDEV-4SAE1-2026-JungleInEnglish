import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ExamService } from '../../../core/services/exam.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-my-exam-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-exam-results.component.html',
  styleUrl: './my-exam-results.component.scss'
})
export class MyExamResultsComponent implements OnInit {
  attempts: any[] = [];
  selectedAttempt: any = null;
  resultDetails: any = null;
  loading = false;
  
  // Expose Math to template
  Math = Math;
  
  stats = {
    total: 0,
    graded: 0,
    pending: 0,
    passed: 0,
    averageScore: 0
  };

  constructor(
    private examService: ExamService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMyAttempts();
  }

  loadMyAttempts(): void {
    this.loading = true;
    const currentUser = this.authService.currentUserValue;
    const userId = currentUser?.id || 1;
    
    this.examService.getUserAttempts(userId).subscribe({
      next: (attempts) => {
        this.attempts = attempts.sort((a, b) => {
          const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
          const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
          return dateB - dateA;
        });
        this.calculateStats();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading attempts:', error);
        this.loading = false;
      }
    });
  }

  calculateStats(): void {
    this.stats.total = this.attempts.length;
    this.stats.graded = this.attempts.filter(a => a.status === 'GRADED').length;
    this.stats.pending = this.attempts.filter(a => a.status === 'SUBMITTED').length;
    this.stats.passed = this.attempts.filter(a => a.passed).length;
    
    const gradedAttempts = this.attempts.filter(a => a.percentageScore != null);
    if (gradedAttempts.length > 0) {
      const sum = gradedAttempts.reduce((acc, a) => acc + a.percentageScore, 0);
      this.stats.averageScore = Math.round(sum / gradedAttempts.length);
    }
  }

  viewResult(attempt: any): void {
    if (attempt.status !== 'GRADED') {
      alert('This exam is still being graded. Please check back later.');
      return;
    }

    this.selectedAttempt = attempt;
    this.loadResultDetails(attempt.id);
  }

  loadResultDetails(attemptId: string): void {
    const currentUser = this.authService.currentUserValue;
    const userId = currentUser?.id || 1;
    
    // Load both the result with reviews and the full exam attempt
    this.examService.getResultWithReview(attemptId, userId).subscribe({
      next: (result) => {
        // Load the full exam structure
        this.examService.getAttempt(attemptId, userId).subscribe({
          next: (attemptData) => {
            // Combine the data
            this.resultDetails = {
              ...result,
              exam: attemptData.exam,
              answers: this.mapReviewsToAnswers(result.questionReviews || [])
            };
          },
          error: (error) => {
            console.error('Error loading exam details:', error);
            alert('Failed to load exam details');
          }
        });
      },
      error: (error) => {
        console.error('Error loading result details:', error);
        alert('Failed to load result details');
      }
    });
  }

  mapReviewsToAnswers(reviews: any[]): any[] {
    return reviews.map(review => ({
      questionId: review.questionId,
      answerData: review.studentAnswer,
      score: review.score,
      isGraded: review.score !== null && review.score !== undefined,
      feedback: review.manualFeedback,
      isCorrect: review.isCorrect
    }));
  }

  backToList(): void {
    this.selectedAttempt = null;
    this.resultDetails = null;
  }

  getStatusBadgeClass(status: string): string {
    const classes: any = {
      'SUBMITTED': 'badge-warning',
      'GRADED': 'badge-success',
      'IN_PROGRESS': 'badge-info'
    };
    return classes[status] || 'badge-secondary';
  }

  getScoreClass(percentage: number): string {
    if (percentage >= 80) return 'score-excellent';
    if (percentage >= 70) return 'score-good';
    if (percentage >= 60) return 'score-pass';
    return 'score-fail';
  }

  downloadCertificate(attemptId: string): void {
    alert('Certificate download feature coming soon!');
  }

  retakeExam(level: string): void {
    this.router.navigate(['/student/exams']);
  }

  getStudentAnswer(questionId: string): any {
    if (!this.resultDetails || !this.resultDetails.answers) {
      return null;
    }
    return this.resultDetails.answers.find((a: any) => a.questionId === questionId);
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

  isAnswerCorrect(question: any, answer: any): boolean {
    if (!answer || !answer.answerData) return false;
    
    try {
      const studentAnswer = this.parseAnswerData(answer.answerData);
      let correctAnswer = '';
      
      if (question.questionType === 'MULTIPLE_CHOICE' || question.questionType === 'TRUE_FALSE') {
        correctAnswer = this.getCorrectOptionLabel(question);
      } else {
        correctAnswer = this.getCorrectAnswer(question);
      }
      
      return studentAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
    } catch {
      return false;
    }
  }
}
