import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Lesson, CreateLessonRequest, UpdateLessonRequest, LessonType } from '../models/lesson.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LessonService {
  private apiUrl = `${environment.apiUrl}/lessons`;

  constructor(private http: HttpClient) {}

  createLesson(lesson: CreateLessonRequest): Observable<Lesson> {
    return this.http.post<Lesson>(this.apiUrl, lesson);
  }

  getLessonById(id: number): Observable<Lesson> {
    return this.http.get<Lesson>(`${this.apiUrl}/${id}`);
  }


  getLessonsByChapter(chapterId: number): Observable<Lesson[]> {
    return this.http.get<Lesson[]>(`${this.apiUrl}/chapter/${chapterId}`);
  }

  getPublishedLessonsByChapter(chapterId: number): Observable<Lesson[]> {
    return this.http.get<Lesson[]>(`${this.apiUrl}/chapter/${chapterId}/published`);
  }

  getLessonsByCourse(courseId: number): Observable<Lesson[]> {
    return this.http.get<Lesson[]>(`${this.apiUrl}/course/${courseId}`);
  }


  getPreviewLessonsByCourse(courseId: number): Observable<Lesson[]> {
    return this.http.get<Lesson[]>(`${this.apiUrl}/course/${courseId}/preview`);
  }

  updateLesson(id: number, lesson: UpdateLessonRequest): Observable<Lesson> {
    return this.http.put<Lesson>(`${this.apiUrl}/${id}`, lesson);
  }

  deleteLesson(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }




  uploadVideo(lessonId: number, file: File): Observable<{url: string, message: string}> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{url: string, message: string}>(`${this.apiUrl}/${lessonId}/upload-video`, formData);
  }

  uploadDocument(lessonId: number, file: File): Observable<{url: string, message: string}> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{url: string, message: string}>(`${this.apiUrl}/${lessonId}/upload-document`, formData);
  }

  deleteContentFile(lessonId: number): Observable<{message: string}> {
    return this.http.delete<{message: string}>(`${this.apiUrl}/${lessonId}/content-file`);
  }

  // FIX 3: Bulk publish/unpublish all lessons in a course
  publishAllLessonsByCourse(courseId: number): Observable<Lesson[]> {
    return this.http.put<Lesson[]>(`${this.apiUrl}/course/${courseId}/publish-all`, {});
  }

  unpublishAllLessonsByCourse(courseId: number): Observable<Lesson[]> {
    return this.http.put<Lesson[]>(`${this.apiUrl}/course/${courseId}/unpublish-all`, {});
  }
}
