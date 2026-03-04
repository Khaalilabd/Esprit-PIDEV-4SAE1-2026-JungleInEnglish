import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, retry, timeout } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../core/services/auth.service';

export interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  subCategories: SubCategory[];
  isLocked?: boolean;
  lockedBy?: number;
  lockedAt?: string;
}

export interface SubCategory {
  id: number;
  name: string;
  description: string;
  categoryId: number;
  requiresClubMembership?: boolean;
  requiresAdminRole?: boolean;
  isLocked?: boolean;
  lockedBy?: number;
  lockedAt?: string;
}

export interface Topic {
  id: number;
  title: string;
  content: string;
  userId: number;
  userName: string;
  subCategoryId: number;
  viewsCount: number;
  reactionsCount?: number;
  likeCount?: number;
  insightfulCount?: number;
  helpfulCount?: number;
  weightedScore?: number;
  isTrending?: boolean;
  isPinned: boolean;
  isLocked: boolean;
  postsCount: number;
  createdAt: string;
  updatedAt: string;
  resourceType?: string;
  resourceLink?: string;
}

export interface Post {
  id: number;
  content: string;
  userId: number;
  userName: string;
  topicId: number;
  reactionsCount?: number;
  likeCount?: number;
  insightfulCount?: number;
  helpfulCount?: number;
  weightedScore?: number;
  isTrending?: boolean;
  isAccepted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTopicRequest {
  subCategoryId: number;
  title: string;
  content?: string; // Optional for Resource Sharing
  userId: number;
  userName: string;
  resourceType?: string;
  resourceLink?: string;
}

export interface CreatePostRequest {
  topicId: number;
  content: string;
  userId: number;
  userName: string;
}

export interface CreateCategoryRequest {
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface CreateSubCategoryRequest {
  categoryId: number;
  name: string;
  description: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class ForumService {
  private apiUrl = `${environment.apiUrl}/community`;
  private authService = inject(AuthService);

  constructor(private http: HttpClient) {}

  // Categories
  getAllCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`).pipe(
      timeout(10000), // 10 seconds timeout
      retry(2) // Retry 2 times on failure
    );
  }

  getCategoryById(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/categories/${id}`);
  }

  getSubCategoryById(id: number): Observable<SubCategory> {
    return this.http.get<SubCategory>(`${this.apiUrl}/categories/subcategories/${id}`);
  }

  initializeCategories(): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/categories/initialize`, {});
  }

  createCategory(request: CreateCategoryRequest): Observable<Category> {
    return this.http.post<Category>(`${this.apiUrl}/categories`, request);
  }

  updateCategory(id: number, request: CreateCategoryRequest): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/categories/${id}`, request);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/categories/${id}`);
  }

  createSubCategory(request: CreateSubCategoryRequest): Observable<SubCategory> {
    return this.http.post<SubCategory>(`${this.apiUrl}/categories/subcategories`, request);
  }

  updateSubCategory(id: number, request: CreateSubCategoryRequest): Observable<SubCategory> {
    return this.http.put<SubCategory>(`${this.apiUrl}/categories/subcategories/${id}`, request);
  }

  deleteSubCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/categories/subcategories/${id}`);
  }

  // Topics
  createTopic(request: CreateTopicRequest): Observable<Topic> {
    const currentUser = this.authService.currentUserValue;
    const headers = currentUser ? new HttpHeaders({ 'X-User-Role': currentUser.role }) : undefined;
    return this.http.post<Topic>(`${this.apiUrl}/topics`, request, { headers });
  }

  getTopicsBySubCategory(subCategoryId: number, page: number = 0, size: number = 20, sortBy: string = 'recent'): Observable<PageResponse<Topic>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy);
    return this.http.get<PageResponse<Topic>>(`${this.apiUrl}/topics/subcategory/${subCategoryId}`, { params });
  }

  getTopicById(id: number): Observable<Topic> {
    const userId = this.authService.currentUserValue?.id;
    const headers = userId ? new HttpHeaders({ 'X-User-Id': userId.toString() }) : undefined;
    return this.http.get<Topic>(`${this.apiUrl}/topics/${id}`, { headers });
  }

  updateTopic(id: number, request: CreateTopicRequest): Observable<Topic> {
    const userId = this.authService.currentUserValue?.id;
    const headers = userId ? new HttpHeaders({ 'X-User-Id': userId.toString() }) : undefined;
    return this.http.put<Topic>(`${this.apiUrl}/topics/${id}`, request, { headers });
  }

  deleteTopic(id: number): Observable<void> {
    const userId = this.authService.currentUserValue?.id;
    const headers = userId ? new HttpHeaders({ 'X-User-Id': userId.toString() }) : undefined;
    return this.http.delete<void>(`${this.apiUrl}/topics/${id}`, { headers });
  }

  // Posts
  createPost(request: CreatePostRequest): Observable<Post> {
    const currentUser = this.authService.currentUserValue;
    const headers = currentUser ? new HttpHeaders({ 'X-User-Role': currentUser.role }) : undefined;
    return this.http.post<Post>(`${this.apiUrl}/posts`, request, { headers });
  }

  getPostsByTopic(topicId: number, page: number = 0, size: number = 20, sortBy: string = 'helpful'): Observable<PageResponse<Post>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy);
    return this.http.get<PageResponse<Post>>(`${this.apiUrl}/posts/topic/${topicId}`, { params });
  }

  updatePost(id: number, request: CreatePostRequest): Observable<Post> {
    const userId = this.authService.currentUserValue?.id;
    const headers = userId ? new HttpHeaders({ 'X-User-Id': userId.toString() }) : undefined;
    return this.http.put<Post>(`${this.apiUrl}/posts/${id}`, request, { headers });
  }

  deletePost(id: number): Observable<void> {
    const userId = this.authService.currentUserValue?.id;
    const headers = userId ? new HttpHeaders({ 'X-User-Id': userId.toString() }) : undefined;
    return this.http.delete<void>(`${this.apiUrl}/posts/${id}`, { headers });
  }

  // Topic Moderation
  pinTopic(id: number): Observable<Topic> {
    return this.http.put<Topic>(`${this.apiUrl}/topics/${id}/pin`, {});
  }

  unpinTopic(id: number): Observable<Topic> {
    return this.http.put<Topic>(`${this.apiUrl}/topics/${id}/unpin`, {});
  }

  lockTopic(id: number): Observable<Topic> {
    return this.http.put<Topic>(`${this.apiUrl}/topics/${id}/lock`, {});
  }

  unlockTopic(id: number): Observable<Topic> {
    return this.http.put<Topic>(`${this.apiUrl}/topics/${id}/unlock`, {});
  }

  // File Upload
  uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/files/upload`, formData);
  }

  // Lock/Unlock Categories and SubCategories
  lockCategory(categoryId: number, userId: number): Observable<void> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.post<void>(`${this.apiUrl}/lock/category/${categoryId}`, {}, { params });
  }

  unlockCategory(categoryId: number, userId: number): Observable<void> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.delete<void>(`${this.apiUrl}/lock/category/${categoryId}`, { params });
  }

  lockSubCategory(subCategoryId: number, userId: number): Observable<void> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.post<void>(`${this.apiUrl}/lock/subcategory/${subCategoryId}`, {}, { params });
  }

  unlockSubCategory(subCategoryId: number, userId: number): Observable<void> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.delete<void>(`${this.apiUrl}/lock/subcategory/${subCategoryId}`, { params });
  }

  // Permissions
  getPermissions(subCategoryId: number, userRole: string): Observable<PermissionInfo> {
    const params = new HttpParams().set('userRole', userRole);
    return this.http.get<PermissionInfo>(`${this.apiUrl}/permissions/subcategory/${subCategoryId}`, { params });
  }
}

export interface PermissionInfo {
  canCreateTopic: boolean;
  canReply: boolean;
  categoryLocked: boolean;
  subCategoryLocked: boolean;
}
