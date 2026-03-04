import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export enum ReactionType {
  LIKE = 'LIKE',
  HELPFUL = 'HELPFUL',
  INSIGHTFUL = 'INSIGHTFUL'
}

export interface ReactionCount {
  type: ReactionType;
  count: number;
}

export interface ReactionRequest {
  type: ReactionType;
}

@Injectable({
  providedIn: 'root'
})
export class ReactionService {
  private apiUrl = `${environment.apiUrl}/community/reactions`;

  constructor(private http: HttpClient) {}

  // Topic reactions
  addReactionToTopic(topicId: number, type: ReactionType, userId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/topics/${topicId}?userId=${userId}&type=${type}`, {});
  }

  removeReactionFromTopic(topicId: number, userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/topics/${topicId}?userId=${userId}`);
  }

  getTopicReactions(topicId: number): Observable<ReactionCount[]> {
    return this.http.get<ReactionCount[]>(`${this.apiUrl}/topics/${topicId}/count`);
  }

  // Post reactions
  addReactionToPost(postId: number, type: ReactionType, userId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/posts/${postId}?userId=${userId}&type=${type}`, {});
  }

  removeReactionFromPost(postId: number, userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/posts/${postId}?userId=${userId}`);
  }

  getPostReactions(postId: number): Observable<ReactionCount[]> {
    return this.http.get<ReactionCount[]>(`${this.apiUrl}/posts/${postId}/count`);
  }
  
  getUserReactionForPost(postId: number, userId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/posts/${postId}/user/${userId}`);
  }
  
  getUserReactionForTopic(topicId: number, userId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/topics/${topicId}/user/${userId}`);
  }
}
