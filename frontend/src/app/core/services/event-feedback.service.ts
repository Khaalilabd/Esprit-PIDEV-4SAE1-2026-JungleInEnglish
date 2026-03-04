import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EventFeedback {
  id?: number;
  eventId: number;
  userId: number;
  rating: number;
  comment?: string;
  anonymous?: boolean;
  createdAt?: string;
  updatedAt?: string;
  userFirstName?: string;
  userLastName?: string;
  userImage?: string;
}

export interface EventFeedbackStats {
  eventId: number;
  averageRating: number;
  totalFeedbacks: number;
  satisfactionRate: number;
  ratingDistribution: { [key: number]: number };
}

@Injectable({
  providedIn: 'root'
})
export class EventFeedbackService {
  private apiUrl = `${environment.apiUrl}/events/feedback`;

  constructor(private http: HttpClient) {}

  createFeedback(feedback: EventFeedback): Observable<EventFeedback> {
    return this.http.post<EventFeedback>(this.apiUrl, feedback);
  }

  getEventFeedbacks(eventId: number): Observable<EventFeedback[]> {
    return this.http.get<EventFeedback[]>(`${this.apiUrl}/event/${eventId}`);
  }

  getEventFeedbackStats(eventId: number): Observable<EventFeedbackStats> {
    return this.http.get<EventFeedbackStats>(`${this.apiUrl}/event/${eventId}/stats`);
  }

  getUserFeedback(eventId: number, userId: number): Observable<EventFeedback> {
    return this.http.get<EventFeedback>(`${this.apiUrl}/event/${eventId}/user/${userId}`);
  }

  hasUserGivenFeedback(eventId: number, userId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/event/${eventId}/user/${userId}/exists`);
  }

  updateFeedback(feedbackId: number, userId: number, feedback: EventFeedback): Observable<EventFeedback> {
    return this.http.put<EventFeedback>(`${this.apiUrl}/${feedbackId}/user/${userId}`, feedback);
  }

  deleteFeedback(feedbackId: number, userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${feedbackId}/user/${userId}`);
  }
}
