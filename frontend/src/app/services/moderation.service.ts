import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PageResponse, Topic } from './forum.service';

export interface ModerationStats {
  totalTopics: number;
  pinnedTopics: number;
  lockedTopics: number;
  normalTopics: number;
}

export interface BulkActionResponse {
  success: boolean;
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class ModerationService {
  private apiUrl = `${environment.apiUrl}/community/moderation`;

  constructor(private http: HttpClient) {}

  // Get all topics for moderation with filters
  getAllTopics(
    categoryId?: number,
    subCategoryId?: number,
    status?: string,
    search?: string,
    page: number = 0,
    size: number = 20,
    sortBy: string = 'createdAt',
    sortDir: string = 'DESC'
  ): Observable<PageResponse<Topic>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);

    if (categoryId) {
      params = params.set('categoryId', categoryId.toString());
    }
    if (subCategoryId) {
      params = params.set('subCategoryId', subCategoryId.toString());
    }
    if (status) {
      params = params.set('status', status);
    }
    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<PageResponse<Topic>>(`${this.apiUrl}/topics`, { params });
  }

  // Bulk actions
  bulkPinTopics(topicIds: number[]): Observable<BulkActionResponse> {
    return this.http.post<BulkActionResponse>(`${this.apiUrl}/topics/bulk-pin`, topicIds);
  }

  bulkUnpinTopics(topicIds: number[]): Observable<BulkActionResponse> {
    return this.http.post<BulkActionResponse>(`${this.apiUrl}/topics/bulk-unpin`, topicIds);
  }

  bulkLockTopics(topicIds: number[]): Observable<BulkActionResponse> {
    return this.http.post<BulkActionResponse>(`${this.apiUrl}/topics/bulk-lock`, topicIds);
  }

  bulkUnlockTopics(topicIds: number[]): Observable<BulkActionResponse> {
    return this.http.post<BulkActionResponse>(`${this.apiUrl}/topics/bulk-unlock`, topicIds);
  }

  bulkDeleteTopics(topicIds: number[], userId: number): Observable<BulkActionResponse> {
    const headers = new HttpHeaders({ 'X-User-Id': userId.toString() });
    return this.http.post<BulkActionResponse>(
      `${this.apiUrl}/topics/bulk-delete`,
      topicIds,
      { headers }
    );
  }

  // Category locking
  lockCategory(categoryId: number, userId: number, reason?: string): Observable<any> {
    const headers = new HttpHeaders({ 'X-User-Id': userId.toString() });
    let params = new HttpParams();
    if (reason) {
      params = params.set('reason', reason);
    }
    return this.http.put(
      `${this.apiUrl}/categories/${categoryId}/lock`,
      {},
      { headers, params }
    );
  }

  unlockCategory(categoryId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/categories/${categoryId}/unlock`, {});
  }

  // Get moderation statistics
  getStats(): Observable<ModerationStats> {
    return this.http.get<ModerationStats>(`${this.apiUrl}/stats`);
  }
}
