import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { AuthService } from './auth.service';

export interface NotificationEvent {
  id: number;
  complaintId: number;
  recipientId: number;
  recipientRole: string;
  notificationType: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationSseService {
  private eventSource: EventSource | null = null;
  private notificationSubject = new Subject<NotificationEvent>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private currentUserId: number | null = null;
  private currentUserRole: string | null = null;

  constructor(
    private authService: AuthService,
    private ngZone: NgZone
  ) {}

  connect(): Observable<NotificationEvent> {
    const currentUser = this.authService.currentUserValue;
    
    if (!currentUser) {
      console.warn('❌ No user logged in, cannot connect to SSE');
      return this.notificationSubject.asObservable();
    }

    // Validate user ID
    if (!currentUser.id || typeof currentUser.id !== 'number') {
      console.error('❌ Invalid user ID:', currentUser.id);
      console.error('❌ Current user object:', currentUser);
      return this.notificationSubject.asObservable();
    }

    // Check if we're already connected for this user
    if (this.eventSource && this.currentUserId === currentUser.id && this.currentUserRole === currentUser.role) {
      console.log('✅ SSE already connected for this user');
      return this.notificationSubject.asObservable();
    }

    // Disconnect existing connection if it's for a different user
    if (this.eventSource && (this.currentUserId !== currentUser.id || this.currentUserRole !== currentUser.role)) {
      console.log('🔄 Disconnecting previous SSE connection');
      this.disconnect();
    }

    // Get user role from current user
    const userRole = currentUser.role || '';
    const userId = currentUser.id;
    
    // SOLUTION FIABLE: Connexion directe au service pour SSE
    // Spring Cloud Gateway (Reactor Netty) ne supporte pas bien les SSE
    // Tous les autres endpoints passent par le Gateway (8088)
    // Seul SSE passe directement par le service (8087)
    const url = `http://localhost:8087/notifications/stream/${userId}?role=${encodeURIComponent(userRole)}`;
    console.log('🔌 Connecting to SSE (direct to service):', url);
    console.log('👤 User ID:', userId, '(type:', typeof userId, ')');
    console.log('🎭 User Role:', userRole);

    this.currentUserId = currentUser.id;
    this.currentUserRole = userRole;

    this.ngZone.runOutsideAngular(() => {
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        console.log('✅ SSE connection opened for role:', userRole);
        this.reconnectAttempts = 0;
      };

      this.eventSource.addEventListener('connected', (event: any) => {
        console.log('✅ SSE connected event received:', event.data);
      });

      this.eventSource.addEventListener('notification', (event: any) => {
        this.ngZone.run(() => {
          try {
            const notification: NotificationEvent = JSON.parse(event.data);
            console.log('🔔 Notification received:', notification);
            this.notificationSubject.next(notification);
          } catch (error) {
            console.error('❌ Error parsing notification:', error);
          }
        });
      });

      this.eventSource.onerror = (error) => {
        console.error('❌ SSE error:', error);
        this.handleError();
      };
    });

    return this.notificationSubject.asObservable();
  }

  private handleError() {
    this.disconnect();

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.currentUserId = null;
      this.currentUserRole = null;
      console.log('SSE connection closed');
    }
  }

  getNotifications(): Observable<NotificationEvent> {
    return this.notificationSubject.asObservable();
  }
}
