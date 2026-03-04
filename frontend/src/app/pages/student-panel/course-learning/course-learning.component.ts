import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CourseService } from '../../../core/services/course.service';
import { ChapterService } from '../../../core/services/chapter.service';
import { LessonService } from '../../../core/services/lesson.service';
import { LessonProgressService } from '../../../core/services/lesson-progress.service';
import { AuthService } from '../../../core/services/auth.service';
import { Course } from '../../../core/models/course.model';
import { Chapter } from '../../../core/models/chapter.model';
import { Lesson } from '../../../core/models/lesson.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { forkJoin } from 'rxjs';

interface ChapterWithProgress {
  chapter: Chapter;
  completedLessons: number;
  totalLessons: number;
}

@Component({
  selector: 'app-course-learning',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './course-learning.component.html',
  styleUrls: ['./course-learning.component.scss']
})
export class CourseLearningComponent implements OnInit {
  courseId!: number;
  course: Course | null = null;
  chaptersMap: Map<number, Chapter[]> = new Map();
  lessonsMap: Map<number, Lesson[]> = new Map();
  chapterProgressMap: Map<number, ChapterWithProgress> = new Map();
  
  loading = true;
  expandedChapters: Set<number> = new Set();
  currentStudentId: number = 0;
  courseProgress: number = 0;
  completedLessonsCount: number = 0;
  totalLessonsCount: number = 0;
  packId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private chapterService: ChapterService,
    private lessonService: LessonService,
    private lessonProgressService: LessonProgressService,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.courseId = +this.route.snapshot.paramMap.get('courseId')!;
    this.packId = this.route.snapshot.queryParamMap.get('packId');
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.currentStudentId = currentUser.id;
    }
    this.loadCourseData();
  }

  loadCourseData(): void {
    this.loading = true;
    
    // Load course
    this.courseService.getCourseById(this.courseId).subscribe({
      next: (course) => {
        this.course = course;
        this.loadChapters(this.courseId);
      },
      error: (error) => {
        console.error('Error loading course:', error);
        this.loading = false;
      }
    });
  }

  loadChapters(courseId: number): void {
    this.chapterService.getChaptersByCourse(courseId).subscribe({
      next: (chapters) => {
        // Only show published chapters
        const publishedChapters = chapters.filter(c => c.isPublished);
        this.chaptersMap.set(courseId, publishedChapters);
        
        // Load lessons for each chapter and calculate progress
        const lessonPromises = publishedChapters.map(chapter => {
          if (chapter.id) {
            return this.loadLessonsAndProgress(chapter.id);
          }
          return Promise.resolve();
        });
        
        Promise.all(lessonPromises).then(() => {
          this.calculateCourseProgress();
          this.loading = false;
        });
      },
      error: (error) => {
        console.error('Error loading chapters:', error);
        this.loading = false;
      }
    });
  }

  loadLessonsAndProgress(chapterId: number): Promise<void> {
    return new Promise((resolve) => {
      this.lessonService.getLessonsByChapter(chapterId).subscribe({
        next: (lessons) => {
          // Only show published lessons
          const publishedLessons = lessons.filter(l => l.isPublished);
          this.lessonsMap.set(chapterId, publishedLessons);
          
          // Calculate chapter progress
          if (this.currentStudentId) {
            this.lessonProgressService.getProgressByStudentAndCourse(this.currentStudentId, this.courseId).subscribe({
              next: (progressList) => {
                const lessonIds = publishedLessons.map(l => l.id);
                const completedInChapter = progressList.filter(p => 
                  p.isCompleted && lessonIds.includes(p.lessonId)
                ).length;
                
                const chapter = this.getChapters(this.courseId).find(c => c.id === chapterId);
                if (chapter) {
                  this.chapterProgressMap.set(chapterId, {
                    chapter,
                    completedLessons: completedInChapter,
                    totalLessons: publishedLessons.length
                  });
                }
                resolve();
              },
              error: () => resolve()
            });
          } else {
            resolve();
          }
        },
        error: (error) => {
          console.error('Error loading lessons:', error);
          resolve();
        }
      });
    });
  }

  calculateCourseProgress(): void {
    this.totalLessonsCount = 0;
    this.completedLessonsCount = 0;
    
    this.chapterProgressMap.forEach((progress) => {
      this.totalLessonsCount += progress.totalLessons;
      this.completedLessonsCount += progress.completedLessons;
    });
    
    if (this.totalLessonsCount > 0) {
      this.courseProgress = Math.round((this.completedLessonsCount / this.totalLessonsCount) * 100);
      
      // FIX 4: Detect course completion and clear cache
      if (this.courseProgress === 100 && this.completedLessonsCount === this.totalLessonsCount) {
        // Clear cache for this course
        this.lessonProgressService.clearCache(this.courseId);
        
        // Show completion message (only once)
        if (!sessionStorage.getItem(`course_${this.courseId}_completed`)) {
          sessionStorage.setItem(`course_${this.courseId}_completed`, 'true');
          alert('🎉 Congratulations! You have completed this course!');
        }
      }
    }
  }

  getChapterProgress(chapterId: number): ChapterWithProgress | undefined {
    return this.chapterProgressMap.get(chapterId);
  }

  toggleChapter(chapterId: number): void {
    if (this.expandedChapters.has(chapterId)) {
      this.expandedChapters.delete(chapterId);
    } else {
      this.expandedChapters.add(chapterId);
    }
  }

  isChapterExpanded(chapterId: number): boolean {
    return this.expandedChapters.has(chapterId);
  }

  getChapters(courseId: number): Chapter[] {
    return this.chaptersMap.get(courseId) || [];
  }

  getLessons(chapterId: number): Lesson[] {
    return this.lessonsMap.get(chapterId) || [];
  }

  viewLesson(lesson: Lesson): void {
    // Navigate to lesson viewer using relative navigation
    // From /user-panel/course/:courseId/learning to /user-panel/lesson/:id
    // Need to go up 3 levels: learning -> :courseId -> course -> user-panel
    this.router.navigate(['../../../lesson', lesson.id], { relativeTo: this.route });
  }

  getLessonIcon(lessonType: string): string {
    switch (lessonType) {
      case 'VIDEO': return '🎥';
      case 'TEXT': return '📝';
      case 'QUIZ': return '❓';
      case 'ASSIGNMENT': return '📋';
      case 'DOCUMENT': return '📄';
      case 'INTERACTIVE': return '🎮';
      default: return '📚';
    }
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

  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }

  goBack(): void {
    // Navigate back to pack courses page if accessed from a pack
    if (this.packId) {
      this.router.navigate(['../../pack', this.packId, 'learning'], { relativeTo: this.route });
    } else {
      this.router.navigate(['../../my-courses'], { relativeTo: this.route });
    }
  }
}
