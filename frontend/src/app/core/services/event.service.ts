import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Event {
  id?: number;
  title: string;
  type: 'WORKSHOP' | 'SEMINAR' | 'SOCIAL';
  startDate: string;
  endDate: string;
  location: string;
  latitude?: number;
  longitude?: number;
  maxParticipants: number;
  currentParticipants?: number;
  description?: string;
  creatorId?: number;
  clubId?: number;
  clubName?: string;
  image?: string;
  gallery?: string[]; // Array of image URLs for gallery
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt?: string;
  updatedAt?: string;
  
  // Backward compatibility (deprecated)
  eventDate?: string;
}

export interface Participant {
  id?: number;
  eventId: number;
  userId: number;
  joinDate?: string;
  userEmail?: string;
  userFirstName?: string;
  userLastName?: string;
}

export interface JoinEventRequest {
  userId: number;
}

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private apiUrl = `${environment.apiUrl}/events`;
  
  // Subject to notify when event participation changes
  private eventParticipationChangedSource = new Subject<void>();
  eventParticipationChanged$ = this.eventParticipationChangedSource.asObservable();

  constructor(private http: HttpClient) {}

  // Notify that event participation has changed
  notifyEventParticipationChanged() {
    this.eventParticipationChangedSource.next();
  }

  // Event CRUD operations
  getAllEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(this.apiUrl);
  }

  getEventById(id: number): Observable<Event> {
    return this.http.get<Event>(`${this.apiUrl}/${id}`);
  }

  getEventsByType(type: string): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.apiUrl}/type/${type}`);
  }

  getUpcomingEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.apiUrl}/upcoming`);
  }

  getEventsByCreator(creatorId: number): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.apiUrl}/creator/${creatorId}`);
  }

  createEvent(event: Event): Observable<Event> {
    return this.http.post<Event>(this.apiUrl, event);
  }

  updateEvent(id: number, event: Event): Observable<Event> {
    return this.http.put<Event>(`${this.apiUrl}/${id}`, event);
  }

  deleteEvent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Event approval operations
  approveEvent(id: number): Observable<Event> {
    return this.http.put<Event>(`${this.apiUrl}/${id}/approve`, {});
  }

  rejectEvent(id: number): Observable<Event> {
    return this.http.put<Event>(`${this.apiUrl}/${id}/reject`, {});
  }

  // Participant operations
  joinEvent(eventId: number, userId: number): Observable<Participant> {
    const request: JoinEventRequest = { userId };
    return this.http.post<Participant>(`${this.apiUrl}/${eventId}/join`, request);
  }

  leaveEvent(eventId: number, userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${eventId}/leave/${userId}`);
  }

  getEventParticipants(eventId: number): Observable<Participant[]> {
    return this.http.get<Participant[]>(`${this.apiUrl}/${eventId}/participants`);
  }

  getUserEvents(userId: number): Observable<Participant[]> {
    return this.http.get<Participant[]>(`${this.apiUrl}/user/${userId}`);
  }

  isUserParticipant(eventId: number, userId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/${eventId}/is-participant/${userId}`);
  }
}
