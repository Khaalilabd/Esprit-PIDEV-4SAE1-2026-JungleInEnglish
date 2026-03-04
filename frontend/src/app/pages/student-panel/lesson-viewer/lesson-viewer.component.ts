import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { LessonService } from '../../../core/services/lesson.service';
import { ChapterService } from '../../../core/services/chapter.service';
import { CourseService } from '../../../core/services/course.service';
import { LessonProgressService } from '../../../core/services/lesson-progress.service';
import { AuthService } from '../../../core/services/auth.service';
import { Lesson } from '../../../core/models/lesson.model';
import { Chapter } from '../../../core/models/chapter.model';
import { Course } from '../../../core/models/course.model';
import { Subscription } from 'rxjs';
import { QuizTakeComponent } from '../quiz-take/quiz-take.component';

interface ChapterWithLessons {
  chapter: Chapter;
  lessons: Lesson[];
  isExpanded: boolean;
}

@Component({
  selector: 'app-lesson-viewer',
  standalone: true,
  imports: [CommonModule, RouterModule, QuizTakeComponent],
  templateUrl: './lesson-viewer.component.html',
  styleUrls: ['./lesson-viewer.component.scss']
})
export class LessonViewerComponent implements OnInit, OnDestroy {
  lessonId!: number;
  courseId!: number;
  lesson: Lesson | null = null;
  course: Course | null = null;
  chaptersWithLessons: ChapterWithLessons[] = [];
  
  loading = true;
  videoUrl: SafeResourceUrl | null = null;
  documentUrl: SafeResourceUrl | null = null;
  isCompleted = false;
  sidebarCollapsed = false;
  
  // Getter for quizId (temporary until Lesson model is updated)
  get lessonQuizId(): number | undefined {
    return (this.lesson as any)?.quizId;
  }
  
  private progressSubscription?: Subscription;
  private currentStudentId: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private lessonService: LessonService,
    private chapterService: ChapterService,
    private courseService: CourseService,
    private progressService: LessonProgressService,
    private authService: AuthService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.lessonId = +this.route.snapshot.paramMap.get('id')!;
    
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.currentStudentId = currentUser.id;
    }
    
    this.loadLesson();
    
    // Subscribe to progress updates
    this.progressSubscription = this.progressService.progressUpdate$.subscribe(lessonId => {
      if (lessonId) {
        // Refresh to show updated completion status
        this.updateCompletionStatus();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.progressSubscription) {
      this.progressSubscription.unsubscribe();
    }
  }

  loadLesson(): void {
    this.loading = true;
    this.lessonService.getLessonById(this.lessonId).subscribe({
      next: (lesson) => {
        this.lesson = lesson;
        console.log('📚 Loaded lesson:', lesson);
        console.log('📝 Lesson type:', lesson.lessonType);
        console.log('🎯 Quiz ID:', this.lessonQuizId);
        
        // Load chapter to get courseId
        if (lesson.chapterId) {
          this.chapterService.getChapterById(lesson.chapterId).subscribe({
            next: (chapter) => {
              this.courseId = chapter.courseId;
              
              // Load full course structure
              this.loadCourseStructure(this.courseId);
              
              // Load progress for this course
              this.loadProgress();
            },
            error: (error) => {
              console.error('Error loading chapter:', error);
              this.loading = false;
            }
          });
        }
        
        // Process video URL if it's a video lesson
        if (lesson.lessonType === 'VIDEO') {
          if (lesson.contentUrl && lesson.contentUrl.trim() !== '') {
            // Check if it's a YouTube/Vimeo URL or local file
            if (lesson.contentUrl.includes('youtube') || lesson.contentUrl.includes('youtu.be') || lesson.contentUrl.includes('vimeo')) {
              this.videoUrl = this.getEmbedUrl(lesson.contentUrl);
            } else {
              // Local video file - sanitize the URL
              // Remove leading slash if present to avoid double slash
              const cleanUrl = lesson.contentUrl.startsWith('/') ? lesson.contentUrl.substring(1) : lesson.contentUrl;
              const localUrl = `http://localhost:8086/${cleanUrl}`;
              this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(localUrl);
            }
          } else {
            this.videoUrl = null;
          }
        }
        
        // Process document URL if it's a document lesson
        if (lesson.lessonType === 'DOCUMENT' && lesson.contentUrl) {
          // Remove leading slash if present to avoid double slash
          const cleanUrl = lesson.contentUrl.startsWith('/') ? lesson.contentUrl.substring(1) : lesson.contentUrl;
          const docUrl = `http://localhost:8086/${cleanUrl}`;
          this.documentUrl = this.sanitizer.bypassSecurityTrustResourceUrl(docUrl);
        }
      },
      error: (error) => {
        console.error('Error loading lesson:', error);
        this.loading = false;
      }
    });
  }

  loadCourseStructure(courseId: number): void {
    // Load course info
    this.courseService.getCourseById(courseId).subscribe({
      next: (course) => {
        this.course = course;
      },
      error: (error) => {
        console.error('Error loading course:', error);
      }
    });

    // Load all chapters with their lessons
    this.chapterService.getChaptersByCourse(courseId).subscribe({
      next: (chapters) => {
        const sortedChapters = chapters
          .filter(c => c.isPublished)
          .sort((a, b) => a.orderIndex - b.orderIndex);
        
        // Load lessons for each chapter
        const chapterPromises = sortedChapters.map(chapter => {
          return new Promise<ChapterWithLessons>((resolve) => {
            this.lessonService.getLessonsByChapter(chapter.id!).subscribe({
              next: (lessons) => {
                const sortedLessons = lessons
                  .filter(l => l.isPublished)
                  .sort((a, b) => a.orderIndex - b.orderIndex);
                
                // Expand chapter if it contains current lesson
                const isExpanded = sortedLessons.some(l => l.id === this.lessonId);
                
                resolve({
                  chapter,
                  lessons: sortedLessons,
                  isExpanded
                });
              },
              error: () => {
                resolve({
                  chapter,
                  lessons: [],
                  isExpanded: false
                });
              }
            });
          });
        });

        Promise.all(chapterPromises).then(chaptersWithLessons => {
          this.chaptersWithLessons = chaptersWithLessons;
          this.loading = false;
        });
      },
      error: (error) => {
        console.error('Error loading chapters:', error);
        this.loading = false;
      }
    });
  }

  loadProgress(): void {
    if (!this.currentStudentId || !this.courseId) return;
    
    this.progressService.getProgressByStudentAndCourse(this.currentStudentId, this.courseId).subscribe({
      next: (progressList) => {
        // Check if current lesson is completed
        const currentProgress = progressList.find(p => p.lessonId === this.lessonId);
        this.isCompleted = currentProgress?.isCompleted || false;
      },
      error: (error) => {
        console.error('Error loading progress:', error);
      }
    });
  }

  updateCompletionStatus(): void {
    // Refresh completion status without reloading everything
    if (!this.currentStudentId || !this.courseId) return;
    
    this.progressService.getProgressByStudentAndCourse(this.currentStudentId, this.courseId).subscribe({
      next: () => {
        // Cache is updated automatically in the service
      }
    });
  }

  getEmbedUrl(url: string): SafeResourceUrl {
    let embedUrl = url;
    
    // Convert YouTube URLs to embed format
    if (url.includes('youtube.com/watch')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }
    // Convert Vimeo URLs to embed format
    else if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      embedUrl = `https://player.vimeo.com/video/${videoId}`;
    }
    
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  markAsComplete(): void {
    if (!this.lesson || !this.currentStudentId || !this.courseId) return;
    
    this.progressService.markLessonComplete(
      this.currentStudentId,
      this.lessonId,
      this.courseId
    ).subscribe({
      next: () => {
        this.isCompleted = true;
        
        // Auto-navigate to next lesson after 1 second
        setTimeout(() => {
          this.goToNextLesson();
        }, 1000);
      },
      error: (error) => {
        console.error('Error marking lesson complete:', error);
        alert('Failed to mark lesson as complete. Please try again.');
      }
    });
  }

  goToPreviousLesson(): void {
    const allLessons = this.getAllLessonsFlat();
    if (allLessons.length === 0) return;
    
    const currentIndex = allLessons.findIndex(l => l.id === this.lessonId);
    if (currentIndex > 0) {
      const previousLesson = allLessons[currentIndex - 1];
      this.navigateToLesson(previousLesson);
    }
  }

  goToNextLesson(): void {
    const allLessons = this.getAllLessonsFlat();
    if (allLessons.length === 0) return;
    
    const currentIndex = allLessons.findIndex(l => l.id === this.lessonId);
    if (currentIndex < allLessons.length - 1) {
      const nextLesson = allLessons[currentIndex + 1];
      
      // Check if next lesson is unlocked
      if (this.isLessonUnlocked(nextLesson)) {
        this.navigateToLesson(nextLesson);
      } else {
        alert('Complete the current lesson to unlock the next one!');
      }
    } else {
      // Last lesson - go back to course learning
      alert('Congratulations! You completed all lessons in this course!');
      this.goBack();
    }
  }

  hasPreviousLesson(): boolean {
    const allLessons = this.getAllLessonsFlat();
    if (allLessons.length === 0) return false;
    const currentIndex = allLessons.findIndex(l => l.id === this.lessonId);
    return currentIndex > 0;
  }

  hasNextLesson(): boolean {
    const allLessons = this.getAllLessonsFlat();
    if (allLessons.length === 0) return false;
    const currentIndex = allLessons.findIndex(l => l.id === this.lessonId);
    return currentIndex < allLessons.length - 1;
  }

  getAllLessonsFlat(): Lesson[] {
    const allLessons: Lesson[] = [];
    this.chaptersWithLessons.forEach(cwl => {
      allLessons.push(...cwl.lessons);
    });
    return allLessons;
  }

  downloadDocument(): void {
    if (this.lesson?.contentUrl) {
      // Remove leading slash if present to avoid double slash
      const cleanUrl = this.lesson.contentUrl.startsWith('/') ? this.lesson.contentUrl.substring(1) : this.lesson.contentUrl;
      const url = `http://localhost:8086/${cleanUrl}`;
      window.open(url, '_blank');
    }
  }

  goBack(): void {
    // Navigate back to course learning page
    if (this.courseId) {
      this.router.navigate(['../../course', this.courseId, 'learning'], { relativeTo: this.route });
    } else {
      this.router.navigate(['../../my-packs'], { relativeTo: this.route });
    }
  }

  toggleChapter(chapterWithLessons: ChapterWithLessons): void {
    chapterWithLessons.isExpanded = !chapterWithLessons.isExpanded;
  }

  navigateToLesson(lesson: Lesson): void {
    if (lesson.id === this.lessonId) return;
    
    // Check if lesson is unlocked
    if (!this.isLessonUnlocked(lesson)) {
      alert('Complete previous lessons to unlock this one!');
      return;
    }
    
    this.router.navigate(['../../lesson', lesson.id], { relativeTo: this.route });
    this.lessonId = lesson.id!;
    this.loadLesson();
  }

  isLessonUnlocked(lesson: Lesson): boolean {
    if (!lesson.id) return false;
    
    // First lesson is always unlocked
    const allLessons = this.getAllLessonsFlat();
    const lessonIndex = allLessons.findIndex(l => l.id === lesson.id);
    
    if (lessonIndex === 0) return true;
    
    // Check if previous lesson is completed
    const previousLesson = allLessons[lessonIndex - 1];
    return this.isLessonCompleted(previousLesson.id!);
  }

  isLessonCompleted(lessonId: number): boolean {
    return this.progressService.isLessonCompleted(this.courseId, lessonId);
  }

  isLessonActive(lessonId: number): boolean {
    return lessonId === this.lessonId;
  }

  getLessonProgress(): number {
    const allLessons = this.getAllLessonsFlat();
    if (allLessons.length === 0) return 0;
    
    const completedCount = allLessons.filter(l => this.isLessonCompleted(l.id!)).length;
    return (completedCount / allLessons.length) * 100;
  }

  getCurrentLessonPosition(): string {
    const allLessons = this.getAllLessonsFlat();
    if (allLessons.length === 0) return '0/0';
    
    const currentIndex = allLessons.findIndex(l => l.id === this.lessonId);
    return `${currentIndex + 1}/${allLessons.length}`;
  }

  getLessonIcon(lessonType?: string): string {
    if (!lessonType && !this.lesson) return '📚';
    const type = lessonType || this.lesson?.lessonType;
    
    switch (type) {
      case 'VIDEO': return '🎥';
      case 'TEXT': return '📝';
      case 'QUIZ': return '❓';
      case 'ASSIGNMENT': return '📋';
      case 'DOCUMENT': return '📄';
      case 'INTERACTIVE': return '🎮';
      default: return '📚';
    }
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  getLessonTypeColor(lessonType: string): string {
    switch (lessonType) {
      case 'VIDEO': return '#ef4444';
      case 'TEXT': return '#3b82f6';
      case 'QUIZ': return '#f59e0b';
      case 'ASSIGNMENT': return '#8b5cf6';
      case 'DOCUMENT': return '#10b981';
      case 'INTERACTIVE': return '#ec4899';
      default: return '#6b7280';
    }
  }

  onQuizCompleted(): void {
    // Mark lesson as complete and move to next
    this.markAsComplete();
  }
}
