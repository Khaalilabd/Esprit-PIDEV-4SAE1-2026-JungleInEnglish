import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { 
  LessonProgress, 
  CreateLessonProgressRequest, 
  UpdateLessonProgressRequest,
  CourseProgressSummary 
} from '../models/lesson-progress.model';

@Injectable({
  providedIn: 'root'
})
export class LessonProgressService {
  private apiUrl = `${environment.apiUrl}/lesson-progress`;
  
  // Cache for completed lessons per course
  private completedLessonsCache = new Map<number, Set<number>>();
  private progressUpdateSubject = new BehaviorSubject<number | null>(null);
  
  public progressUpdate$ = this.progressUpdateSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Get progress for a specific lesson
  getProgressByStudentAndLesson(studentId: number, lessonId: number): Observable<LessonProgress> {
    return this.http.get<LessonProgress>(`${this.apiUrl}/student/${studentId}/lesson/${lessonId}`);
  }

  // Get all progress for a student in a course
  getProgressByStudentAndCourse(studentId: number, courseId: number): Observable<LessonProgress[]> {
    return this.http.get<LessonProgress[]>(`${this.apiUrl}/student/${studentId}/course/${courseId}`)
      .pipe(
        tap(progressList => {
          // Update cache
          const completedSet = new Set<number>();
          progressList.forEach(progress => {
            if (progress.isCompleted) {
              completedSet.add(progress.lessonId);
            }
          });
          this.completedLessonsCache.set(courseId, completedSet);
        })
      );
  }

  // Get course progress summary
  getCourseProgressSummary(studentId: number, courseId: number): Observable<CourseProgressSummary> {
    return this.http.get<CourseProgressSummary>(`${this.apiUrl}/student/${studentId}/course/${courseId}/summary`);
  }

  // Mark lesson as completed
  markLessonComplete(studentId: number, lessonId: number, courseId: number, timeSpent?: number): Observable<LessonProgress> {
    const request: CreateLessonProgressRequest = {
      studentId,
      lessonId,
      courseId,
      isCompleted: true,
      timeSpent
    };
    
    return this.http.post<LessonProgress>(this.apiUrl, request)
      .pipe(
        tap(progress => {
          // Update cache
          if (!this.completedLessonsCache.has(courseId)) {
            this.completedLessonsCache.set(courseId, new Set());
          }
          this.completedLessonsCache.get(courseId)!.add(lessonId);
          
          // Notify subscribers
          this.progressUpdateSubject.next(lessonId);
        })
      );
  }


  // Check if lesson is completed (from cache or API)
  isLessonCompleted(courseId: number, lessonId: number): boolean {
    const completedSet = this.completedLessonsCache.get(courseId);
    return completedSet ? completedSet.has(lessonId) : false;
  }

  // FIX 4: Clear cache (useful when switching courses or unenrolling)
  // Now accepts optional courseId to clear specific course or all courses
  clearCache(courseId?: number): void {
    if (courseId !== undefined) {
      // Clear cache for specific course only
      this.completedLessonsCache.delete(courseId);
    } else {
      // Clear all cache
      this.completedLessonsCache.clear();
    }
  }

  // Get all completed lesson IDs for a course
  getCompletedLessonIds(courseId: number): number[] {
    const completedSet = this.completedLessonsCache.get(courseId);
    return completedSet ? Array.from(completedSet) : [];
  }
}
