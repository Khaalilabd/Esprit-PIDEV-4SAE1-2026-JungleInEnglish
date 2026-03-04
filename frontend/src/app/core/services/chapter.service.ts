
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Chapter, CreateChapterRequest, UpdateChapterRequest } from '../models/chapter.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChapterService {
  private apiUrl = `${environment.apiUrl}/chapters`;

  constructor(private http: HttpClient) {}

  createChapter(chapter: CreateChapterRequest): Observable<Chapter> {
    return this.http.post<Chapter>(this.apiUrl, chapter);
  }

  getChapterById(id: number): Observable<Chapter> {
    return this.http.get<Chapter>(`${this.apiUrl}/${id}`);
  }

  getChaptersByCourse(courseId: number): Observable<Chapter[]> {
    return this.http.get<Chapter[]>(`${this.apiUrl}/course/${courseId}`);
  }

  getPublishedChaptersByCourse(courseId: number): Observable<Chapter[]> {
    return this.http.get<Chapter[]>(`${this.apiUrl}/course/${courseId}/published`);
  }

  updateChapter(id: number, chapter: UpdateChapterRequest): Observable<Chapter> {
    return this.http.put<Chapter>(`${this.apiUrl}/${id}`, chapter);
  }

  deleteChapter(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // FIX 3: Bulk publish/unpublish all chapters in a course
  publishAllChaptersByCourse(courseId: number): Observable<Chapter[]> {
    return this.http.put<Chapter[]>(`${this.apiUrl}/course/${courseId}/publish-all`, {});
  }

  unpublishAllChaptersByCourse(courseId: number): Observable<Chapter[]> {
    return this.http.put<Chapter[]>(`${this.apiUrl}/course/${courseId}/unpublish-all`, {});
  }
}
