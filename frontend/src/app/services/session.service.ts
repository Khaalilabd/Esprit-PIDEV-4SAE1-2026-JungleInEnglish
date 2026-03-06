import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserSession {
  id: number;
  userId: number;
  sessionToken: string;
  deviceInfo: string;
  browserName: string;
  browserVersion: string;
  operatingSystem: string;
  deviceType: 'DESKTOP' | 'MOBILE' | 'TABLET' | 'UNKNOWN';
  ipAddress: string;
  country: string;
  city: string;
  isp: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'TERMINATED' | 'SUSPICIOUS';
  lastActivity: string;
  createdAt: string;
  expiresAt: string;
  terminatedAt?: string;
  terminationReason?: string;
  suspicious: boolean;
  suspiciousReasons?: string;
  loginCount: number;
  lastLoginAt: string;
  isCurrent?: boolean;
  userName?: string;
  userEmail?: string;
}

export interface SessionSummary {
  totalActiveSessions: number;
  currentSession: UserSession | null;
  otherSessions: UserSession[];
  suspiciousCount: number;
  lastActivity: string;
}

export interface SessionStatistics {
  statusStatistics: { [key: string]: number };
  deviceStatistics: { [key: string]: number };
  geographicStatistics: { [key: string]: number };
  totalActiveSessions: number;
  suspiciousSessions: number;
}

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private apiUrl = 'http://localhost:8080/sessions';

  constructor(private http: HttpClient) {}

  /**
   * Get current user's active sessions
   */
  getMyActiveSessions(currentSessionToken?: string): Observable<UserSession[]> {
    let params = new HttpParams();
    if (currentSessionToken) {
      params = params.set('currentSessionToken', currentSessionToken);
    }
    return this.http.get<UserSession[]>(`${this.apiUrl}/my-sessions`, { params });
  }

  /**
   * Get session summary for current user
   */
  getSessionSummary(currentSessionToken?: string): Observable<SessionSummary> {
    return new Observable(observer => {
      this.getMyActiveSessions(currentSessionToken).subscribe({
        next: (sessions) => {
          const currentSession = sessions.find(s => s.isCurrent) || null;
          const otherSessions = sessions.filter(s => !s.isCurrent);
          const suspiciousCount = sessions.filter(s => s.suspicious).length;
          const lastActivity = sessions.length > 0 
            ? sessions.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())[0].lastActivity
            : new Date().toISOString();

          observer.next({
            totalActiveSessions: sessions.length,
            currentSession,
            otherSessions,
            suspiciousCount,
            lastActivity
          });
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }

  /**
   * Get all sessions with pagination
   */
  getMyAllSessions(page: number = 0, size: number = 20, currentSessionToken?: string): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (currentSessionToken) {
      params = params.set('currentSessionToken', currentSessionToken);
    }
    
    return this.http.get<any>(`${this.apiUrl}/my-sessions/all`, { params });
  }

  /**
   * Terminate a specific session
   */
  terminateSession(sessionId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/my-sessions/${sessionId}`);
  }

  /**
   * Terminate all other sessions (keep current)
   */
  terminateOtherSessions(currentSessionToken?: string): Observable<{ message: string; terminatedCount: number }> {
    let params = new HttpParams();
    if (currentSessionToken) {
      params = params.set('currentSessionToken', currentSessionToken);
    }
    return this.http.delete<{ message: string; terminatedCount: number }>(
      `${this.apiUrl}/my-sessions/others`, 
      { params }
    );
  }

  /**
   * Get session statistics (admin only)
   */
  getSessionStatistics(days: number = 30): Observable<SessionStatistics> {
    const params = new HttpParams().set('days', days.toString());
    return this.http.get<SessionStatistics>(`${this.apiUrl}/admin/statistics`, { params });
  }

  /**
   * Get device icon based on device type
   */
  getDeviceIcon(deviceType: string): string {
    switch (deviceType) {
      case 'DESKTOP':
        return 'fa-desktop';
      case 'MOBILE':
        return 'fa-mobile-alt';
      case 'TABLET':
        return 'fa-tablet-alt';
      default:
        return 'fa-question-circle';
    }
  }

  /**
   * Get browser icon based on browser name
   */
  getBrowserIcon(browserName: string): string {
    const browser = browserName?.toLowerCase() || '';
    if (browser.includes('chrome')) return 'fa-chrome';
    if (browser.includes('firefox')) return 'fa-firefox';
    if (browser.includes('safari')) return 'fa-safari';
    if (browser.includes('edge')) return 'fa-edge';
    if (browser.includes('opera')) return 'fa-opera';
    return 'fa-globe';
  }

  /**
   * Get OS icon based on operating system
   */
  getOSIcon(os: string): string {
    const osLower = os?.toLowerCase() || '';
    if (osLower.includes('windows')) return 'fa-windows';
    if (osLower.includes('mac') || osLower.includes('ios')) return 'fa-apple';
    if (osLower.includes('linux')) return 'fa-linux';
    if (osLower.includes('android')) return 'fa-android';
    return 'fa-desktop';
  }

  /**
   * Get status badge color
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'green';
      case 'INACTIVE':
        return 'gray';
      case 'EXPIRED':
        return 'orange';
      case 'TERMINATED':
        return 'red';
      case 'SUSPICIOUS':
        return 'red';
      default:
        return 'gray';
    }
  }

  /**
   * Format location string
   */
  formatLocation(session: UserSession): string {
    const parts = [];
    if (session.city && session.city !== 'Unknown') parts.push(session.city);
    if (session.country && session.country !== 'Unknown') parts.push(session.country);
    return parts.length > 0 ? parts.join(', ') : 'Unknown Location';
  }

  /**
   * Get current session token from localStorage
   */
  getCurrentSessionToken(): string | null {
    return localStorage.getItem('sessionToken');
  }
}
