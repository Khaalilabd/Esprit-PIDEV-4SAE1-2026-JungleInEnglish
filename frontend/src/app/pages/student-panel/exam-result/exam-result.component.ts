import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamService } from '../../../core/services/exam.service';
import { AuthService } from '../../../core/services/auth.service';
import { ResultWithReview, QuestionType } from '../../../core/models/exam.model';

@Component({
  selector: 'app-exam-result',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exam-result.component.html',
  styleUrl: './exam-result.component.scss'
})
export class ExamResultComponent implements OnInit {
  result: ResultWithReview | null = null;
  loading = true;
  QuestionType = QuestionType;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private examService: ExamService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const attemptId = this.route.snapshot.paramMap.get('attemptId');
    if (attemptId) {
      this.loadResult(attemptId);
    }
  }

  loadResult(attemptId: string): void {
    const userId = this.getUserId();
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }

    this.examService.getResultWithReview(attemptId, userId).subscribe({
      next: (result) => {
        this.result = result;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load result:', error);
        alert('Failed to load exam result. Please try again.');
        this.router.navigate(['/user-panel/exams']);
      }
    });
  }

  get passStatus(): string {
    return this.result?.passed ? 'PASSED' : 'FAILED';
  }

  get passStatusClass(): string {
    return this.result?.passed ? 'pass' : 'fail';
  }

  get cefrRecommendation(): string {
    return this.result?.cefrBand || 'Not Available';
  }

  getPartBreakdown(): any[] {
    if (!this.result?.partBreakdown) return [];
    
    const breakdown = this.result.partBreakdown;
    if (typeof breakdown === 'object') {
      return Object.entries(breakdown).map(([key, value]: [string, any]) => ({
        name: key,
        score: value.score || 0,
        maxScore: value.maxScore || 0,
        percentage: value.maxScore > 0 ? ((value.score / value.maxScore) * 100).toFixed(1) : '0'
      }));
    }
    return [];
  }

  getQuestionTypeLabel(type: QuestionType): string {
    const labels: { [key in QuestionType]: string } = {
      [QuestionType.MULTIPLE_CHOICE]: 'Multiple Choice',
      [QuestionType.TRUE_FALSE]: 'True/False',
      [QuestionType.FILL_IN_GAP]: 'Fill in the Gap',
      [QuestionType.WORD_ORDERING]: 'Word Ordering',
      [QuestionType.MATCHING]: 'Matching',
      [QuestionType.DROPDOWN_SELECT]: 'Dropdown Select',
      [QuestionType.OPEN_WRITING]: 'Open Writing',
      [QuestionType.AUDIO_RESPONSE]: 'Audio Response'
    };
    return labels[type] || type;
  }

  formatAnswer(answer: any): string {
    if (answer === null || answer === undefined) return 'No answer';
    if (typeof answer === 'boolean') return answer ? 'True' : 'False';
    if (Array.isArray(answer)) return answer.join(', ');
    if (typeof answer === 'object') return JSON.stringify(answer);
    return String(answer);
  }

  goToExams(): void {
    this.router.navigate(['/user-panel/exams']);
  }

  retakeExam(): void {
    if (this.result) {
      this.router.navigate(['/user-panel/exams']);
    }
  }

  getUserId(): number {
    const user = this.authService.currentUserValue;
    return user?.id || 0;
  }
}
