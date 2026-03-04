import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamService } from '../../../core/services/exam.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  ExamAttemptWithExam,
  ExamPart,
  Question,
  QuestionType,
  AnswerItem,
  SaveAnswersRequest
} from '../../../core/models/exam.model';

@Component({
  selector: 'app-exam-taking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exam-taking.component.html',
  styleUrl: './exam-taking.component.scss'
})
export class ExamTakingComponent implements OnInit, OnDestroy {
  attempt: ExamAttemptWithExam | null = null;
  currentPartIndex = 0;
  answers: Map<string, any> = new Map();
  timeRemaining = 0;
  timerInterval: any;
  autoSaveInterval: any;
  loading = true;
  submitting = false;
  QuestionType = QuestionType;
  
  // Fullscreen and monitoring
  isFullscreen = false;
  tabSwitchCount = 0;
  showWarning = false;
  warningMessage = '';
  showExitConfirmation = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private examService: ExamService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    const attemptId = this.route.snapshot.paramMap.get('attemptId');
    if (attemptId) {
      this.loadAttempt(attemptId);
    }
    
    // Set up monitoring
    this.setupFullscreenMonitoring();
    this.setupVisibilityMonitoring();
    this.setupBeforeUnload();
  }

  ngOnDestroy(): void {
    this.clearTimers();
    this.removeEventListeners();
    this.exitFullscreen();
  }

  setupFullscreenMonitoring(): void {
    document.addEventListener('fullscreenchange', () => this.onFullscreenChange());
    document.addEventListener('webkitfullscreenchange', () => this.onFullscreenChange());
    document.addEventListener('mozfullscreenchange', () => this.onFullscreenChange());
    document.addEventListener('MSFullscreenChange', () => this.onFullscreenChange());
  }

  setupVisibilityMonitoring(): void {
    document.addEventListener('visibilitychange', () => this.onVisibilityChange());
    window.addEventListener('blur', () => this.onWindowBlur());
  }

  setupBeforeUnload(): void {
    window.addEventListener('beforeunload', (e) => {
      if (this.attempt && !this.submitting) {
        e.preventDefault();
        e.returnValue = 'Your exam is in progress. Are you sure you want to leave?';
        return e.returnValue;
      }
    });
  }

  removeEventListeners(): void {
    document.removeEventListener('fullscreenchange', () => this.onFullscreenChange());
    document.removeEventListener('webkitfullscreenchange', () => this.onFullscreenChange());
    document.removeEventListener('mozfullscreenchange', () => this.onFullscreenChange());
    document.removeEventListener('MSFullscreenChange', () => this.onFullscreenChange());
    document.removeEventListener('visibilitychange', () => this.onVisibilityChange());
    window.removeEventListener('blur', () => this.onWindowBlur());
  }

  onFullscreenChange(): void {
    const isCurrentlyFullscreen = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );

    if (!isCurrentlyFullscreen && this.attempt && !this.submitting) {
      this.showWarningMessage('⚠️ Please stay in fullscreen mode during the exam!');
      setTimeout(() => this.enterFullscreen(), 1000);
    }
  }

  onVisibilityChange(): void {
    if (document.hidden && this.attempt && !this.submitting) {
      this.tabSwitchCount++;
      this.showWarningMessage(`⚠️ Tab switch detected! (${this.tabSwitchCount} times) - Stay on this tab!`);
    }
  }

  onWindowBlur(): void {
    if (this.attempt && !this.submitting) {
      this.showWarningMessage('⚠️ Focus on the exam window!');
    }
  }

  showWarningMessage(message: string): void {
    this.warningMessage = message;
    this.showWarning = true;
    setTimeout(() => {
      this.showWarning = false;
    }, 5000);
  }

  enterFullscreen(): void {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if ((elem as any).webkitRequestFullscreen) {
      (elem as any).webkitRequestFullscreen();
    } else if ((elem as any).mozRequestFullScreen) {
      (elem as any).mozRequestFullScreen();
    } else if ((elem as any).msRequestFullscreen) {
      (elem as any).msRequestFullscreen();
    }
    this.isFullscreen = true;
  }

  exitFullscreen(): void {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    } else if ((document as any).mozCancelFullScreen) {
      (document as any).mozCancelFullScreen();
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen();
    }
    this.isFullscreen = false;
  }

  loadAttempt(attemptId: string): void {
    const userId = this.getUserId();
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }

    this.examService.getAttempt(attemptId, userId).subscribe({
      next: (attempt) => {
        console.log('📦 RAW Loaded attempt:', attempt);
        console.log('📦 Attempt.exam:', attempt.exam);
        console.log('📦 Attempt.exam.totalDuration:', attempt.exam?.totalDuration);
        console.log('📦 Attempt.startedAt:', attempt.startedAt);
        console.log('📦 Exam parts:', attempt.exam?.parts);
        console.log('📦 Total parts:', attempt.exam?.parts?.length);
        if (attempt.exam?.parts && attempt.exam.parts.length > 0) {
          console.log('📦 First part questions:', attempt.exam.parts[0].questions);
          console.log('📦 First part question count:', attempt.exam.parts[0].questions?.length);
        }
        
        this.attempt = attempt;
        
        // Load existing answers into the map
        if (attempt.answers && attempt.answers.length > 0) {
          attempt.answers.forEach((answer: any) => {
            if (answer.answerData) {
              try {
                const parsed = JSON.parse(answer.answerData);
                this.answers.set(answer.questionId, parsed);
              } catch {
                this.answers.set(answer.questionId, answer.answerData);
              }
            }
          });
        }
        
        // Calculate and start timer BEFORE setting loading to false
        this.calculateTimeRemaining();
        this.startTimer();
        this.startAutoSave();
        
        // Force change detection
        this.cdr.detectChanges();
        
        this.loading = false;
        
        // Enter fullscreen mode after loading
        setTimeout(() => {
          this.enterFullscreen();
        }, 500);
      },
      error: (error) => {
        console.error('Failed to load attempt:', error);
        alert('Failed to load exam. Please try again.');
        this.router.navigate(['/user-panel/exams']);
      }
    });
  }

  calculateTimeRemaining(): void {
    if (!this.attempt) {
      console.error('❌ No attempt found');
      this.timeRemaining = 0;
      return;
    }
    
    if (!this.attempt.exam || !this.attempt.exam.totalDuration) {
      console.error('❌ Exam or totalDuration is missing:', this.attempt.exam);
      this.timeRemaining = 0;
      return;
    }
    
    if (!this.attempt.startedAt) {
      console.error('❌ startedAt is missing:', this.attempt);
      this.timeRemaining = 0;
      return;
    }
    
    const startTime = new Date(this.attempt.startedAt).getTime();
    
    if (isNaN(startTime)) {
      console.error('❌ Invalid startedAt date:', this.attempt.startedAt);
      this.timeRemaining = 0;
      return;
    }
    
    const now = new Date().getTime();
    const elapsed = Math.floor((now - startTime) / 1000);
    const totalSeconds = this.attempt.exam.totalDuration * 60;
    this.timeRemaining = Math.max(0, totalSeconds - elapsed);
    
    console.log('✅ Timer calculated:', {
      startTime: this.attempt.startedAt,
      startTimeMs: startTime,
      nowMs: now,
      totalDuration: this.attempt.exam.totalDuration,
      totalSeconds: totalSeconds,
      elapsed: elapsed,
      timeRemaining: this.timeRemaining,
      formatted: this.formattedTime
    });
  }

  startTimer(): void {
    // Clear any existing timer first
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    
    console.log('🕐 Starting timer with', this.timeRemaining, 'seconds');
    
    // Use NgZone.run to ensure Angular detects changes
    this.timerInterval = setInterval(() => {
      this.ngZone.run(() => {
        if (this.timeRemaining > 0) {
          this.timeRemaining--;
          console.log('⏱️ Timer tick:', this.timeRemaining, 'formatted:', this.formattedTime);
          
          if (this.timeRemaining <= 0) {
            console.log('⏰ Time is up! Auto-submitting...');
            this.autoSubmit();
          }
        }
      });
    }, 1000);
  }

  startAutoSave(): void {
    this.autoSaveInterval = setInterval(() => {
      this.saveAnswers(false);
    }, 30000); // Auto-save every 30 seconds
  }

  clearTimers(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
  }

  get currentPart(): ExamPart | null {
    return this.attempt?.exam.parts[this.currentPartIndex] || null;
  }

  get formattedTime(): string {
    if (this.timeRemaining === undefined || this.timeRemaining === null || isNaN(this.timeRemaining)) {
      console.warn('⚠️ formattedTime called with invalid timeRemaining:', this.timeRemaining);
      return '00:00:00';
    }
    const hours = Math.floor(this.timeRemaining / 3600);
    const minutes = Math.floor((this.timeRemaining % 3600) / 60);
    const seconds = this.timeRemaining % 60;
    const formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    return formatted;
  }

  nextPart(): void {
    if (this.attempt && this.currentPartIndex < this.attempt.exam.parts.length - 1) {
      this.currentPartIndex++;
    }
  }

  previousPart(): void {
    if (this.currentPartIndex > 0) {
      this.currentPartIndex--;
    }
  }

  goToPart(index: number): void {
    this.currentPartIndex = index;
  }

  setAnswer(questionId: string, answer: any): void {
    this.answers.set(questionId, answer);
  }

  getAnswer(questionId: string): any {
    return this.answers.get(questionId);
  }

  toggleOption(questionId: string, optionId: string): void {
    const current = this.getAnswer(questionId) || [];
    const index = current.indexOf(optionId);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(optionId);
    }
    this.setAnswer(questionId, [...current]);
  }

  saveAnswers(showMessage = true): void {
    if (!this.attempt) return;

    const userId = this.getUserId();
    if (!userId) return;

    const answerItems: AnswerItem[] = Array.from(this.answers.entries()).map(([questionId, answerData]) => ({
      questionId,
      answerData: JSON.stringify(answerData) // Convert to JSON string
    }));

    const request: SaveAnswersRequest = { answers: answerItems };
    
    console.log('Saving answers:', request);

    this.examService.saveAnswers(this.attempt.id, userId, request).subscribe({
      next: () => {
        if (showMessage) {
          alert('Answers saved successfully!');
        }
      },
      error: (error) => {
        console.error('Failed to save answers:', error);
      }
    });
  }

  submitExam(): void {
    if (!this.attempt) return;

    if (!confirm('Are you sure you want to submit your exam? You cannot change your answers after submission.')) {
      return;
    }

    this.submitting = true;
    this.clearTimers();

    const userId = this.getUserId();
    if (!userId) return;

    // Save answers first
    const answerItems: AnswerItem[] = Array.from(this.answers.entries()).map(([questionId, answerData]) => ({
      questionId,
      answerData: JSON.stringify(answerData) // Convert to JSON string
    }));

    const request: SaveAnswersRequest = { answers: answerItems };

    this.examService.saveAnswers(this.attempt.id, userId, request).subscribe({
      next: () => {
        // Then submit
        this.examService.submitExam(this.attempt!.id, userId).subscribe({
          next: () => {
            this.exitFullscreen();
            this.router.navigate(['/user-panel/my-exam-results']);
          },
          error: (error) => {
            console.error('Failed to submit exam:', error);
            alert('Failed to submit exam. Please try again.');
            this.submitting = false;
          }
        });
      },
      error: (error) => {
        console.error('Failed to save answers:', error);
        alert('Failed to save answers. Please try again.');
        this.submitting = false;
      }
    });
  }

  autoSubmit(): void {
    this.clearTimers();
    this.submitting = true;
    
    const userId = this.getUserId();
    if (!userId || !this.attempt) return;

    // Save current answers
    const answerItems: AnswerItem[] = Array.from(this.answers.entries()).map(([questionId, answerData]) => ({
      questionId,
      answerData: JSON.stringify(answerData) // Convert to JSON string
    }));

    const request: SaveAnswersRequest = { answers: answerItems };

    this.examService.saveAnswers(this.attempt.id, userId, request).subscribe({
      next: () => {
        // Then submit
        this.examService.submitExam(this.attempt!.id, userId).subscribe({
          next: () => {
            this.exitFullscreen();
            this.router.navigate(['/user-panel/my-exam-results']);
          },
          error: (error) => {
            console.error('Failed to auto-submit exam:', error);
            this.exitFullscreen();
            this.router.navigate(['/user-panel/my-exam-results']);
          }
        });
      },
      error: (error) => {
        console.error('Failed to save answers during auto-submit:', error);
        // Still try to submit
        this.examService.submitExam(this.attempt!.id, userId).subscribe({
          next: () => {
            this.exitFullscreen();
            this.router.navigate(['/user-panel/my-exam-results']);
          },
          error: () => {
            this.exitFullscreen();
            this.router.navigate(['/user-panel/my-exam-results']);
          }
        });
      }
    });
  }

  isQuestionAnswered(questionId: string): boolean {
    const answer = this.getAnswer(questionId);
    if (answer === null || answer === undefined) return false;
    if (Array.isArray(answer)) return answer.length > 0;
    if (typeof answer === 'string') return answer.trim().length > 0;
    return true;
  }

  getAnsweredCount(): number {
    if (!this.attempt) return 0;
    let count = 0;
    this.attempt.exam.parts.forEach(part => {
      part.questions.forEach(question => {
        if (this.isQuestionAnswered(question.id)) {
          count++;
        }
      });
    });
    return count;
  }

  getTotalQuestions(): number {
    if (!this.attempt) return 0;
    return this.attempt.exam.parts.reduce((sum, part) => sum + part.questions.length, 0);
  }

  isImageUrl(url: string): boolean {
    return /\.(jpg|jpeg|png|gif)$/i.test(url);
  }

  isAudioUrl(url: string): boolean {
    return /\.(mp3|wav|ogg)$/i.test(url);
  }

  getUserId(): number {
    const user = this.authService.currentUserValue;
    return user?.id || 0;
  }

  exitExam(): void {
    this.showExitConfirmation = true;
  }

  cancelExit(): void {
    this.showExitConfirmation = false;
  }

  confirmExit(): void {
    if (!this.attempt) return;

    const userId = this.getUserId();
    if (!userId) return;

    this.clearTimers();
    this.exitFullscreen();

    this.examService.deleteAttempt(this.attempt.id, userId).subscribe({
      next: () => {
        this.router.navigate(['/user-panel/exams']);
      },
      error: (error) => {
        console.error('Failed to delete attempt:', error);
        alert('Failed to exit exam. Please try again.');
        this.showExitConfirmation = false;
      }
    });
  }
}
