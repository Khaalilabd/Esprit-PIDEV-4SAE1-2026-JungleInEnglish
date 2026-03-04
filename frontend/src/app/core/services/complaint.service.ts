import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Complaint {
  id?: number;
  userId: number;
  targetRole?: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  priority?: string;
  courseType?: string;
  difficulty?: string;
  issueType?: string;
  sessionCount?: number;
  response?: string | null;
  responderId?: number;
  responderRole?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ComplaintWithUser {
  id: number;
  userId: number;
  username: string;
  userEmail: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  riskScore: number;
  requiresIntervention: boolean;
  response?: string;
  createdAt: string;
  updatedAt: string;
  daysSinceCreation: number;
  isOverdue: boolean;
  escalationHistory: string[];
  // Additional details based on category
  courseType?: string;
  difficulty?: string;
  issueType?: string;
  sessionCount?: number;
  responderId?: number;
  responderRole?: string;
}

export interface ComplaintWorkflow {
  id: number;
  complaintId: number;
  fromStatus: string;
  toStatus: string;
  actorId: number;
  actorRole: string;
  actorName?: string;
  comment: string;
  isEscalation: boolean;
  escalationReason?: string;
  timestamp: string;
}

export interface ComplaintNotification {
  id: number;
  complaintId: number;
  recipientId: number;
  recipientRole: string;
  notificationType: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ComplaintService {
  private apiUrl = 'http://localhost:8088/api/complaints';

  constructor(private http: HttpClient) {}

  createComplaint(complaint: any): Observable<Complaint> {
    return this.http.post<Complaint>(this.apiUrl, complaint);
  }

  getMyComplaints(userId: number): Observable<Complaint[]> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.get<Complaint[]>(`${this.apiUrl}/my-complaints`, { params });
  }

  getAllComplaints(): Observable<Complaint[]> {
    return this.http.get<Complaint[]>(this.apiUrl);
  }

  getComplaintById(id: number): Observable<Complaint> {
    return this.http.get<Complaint>(`${this.apiUrl}/${id}`);
  }

  updateComplaint(id: number, complaint: Partial<Complaint>): Observable<Complaint> {
    return this.http.put<Complaint>(`${this.apiUrl}/${id}`, complaint);
  }

  deleteComplaint(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getComplaintsByStatus(status: string): Observable<Complaint[]> {
    return this.http.get<Complaint[]>(`${this.apiUrl}/status/${status}`);
  }

  getComplaintsByUserId(userId: number): Observable<Complaint[]> {
    return this.http.get<Complaint[]>(`${this.apiUrl}/user/${userId}`);
  }

  // Academic Office Affairs endpoints
  getAllComplaintsWithUserInfo(): Observable<ComplaintWithUser[]> {
    return this.http.get<ComplaintWithUser[]>(`${this.apiUrl}/academic/all`);
  }

  getComplaintsForAcademicOffice(): Observable<ComplaintWithUser[]> {
    return this.http.get<ComplaintWithUser[]>(`${this.apiUrl}/academic/filtered`);
  }

  getComplaintsForTutor(): Observable<ComplaintWithUser[]> {
    return this.http.get<ComplaintWithUser[]>(`${this.apiUrl}/tutor/complaints`);
  }

  getCriticalComplaints(): Observable<ComplaintWithUser[]> {
    return this.http.get<ComplaintWithUser[]>(`${this.apiUrl}/academic/critical`);
  }

  getOverdueComplaints(): Observable<ComplaintWithUser[]> {
    return this.http.get<ComplaintWithUser[]>(`${this.apiUrl}/academic/overdue`);
  }

  // Workflow endpoints
  getComplaintHistory(id: number): Observable<ComplaintWorkflow[]> {
    return this.http.get<ComplaintWorkflow[]>(`${this.apiUrl}/${id}/history-with-names`);
  }

  updateComplaintStatus(id: number, data: {
    status: string;
    actorId: number;
    actorRole: string;
    comment?: string;
    response?: string;
  }): Observable<Complaint> {
    return this.http.post<Complaint>(`${this.apiUrl}/${id}/status`, data);
  }

  // Notification endpoints
  getUserNotifications(userId: number): Observable<ComplaintNotification[]> {
    return this.http.get<ComplaintNotification[]>(`${this.apiUrl}/notifications/${userId}`);
  }

  markNotificationAsRead(notificationId: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/notifications/${notificationId}/read`, {});
  }

  getUnreadNotificationCount(userId: number): Observable<{ unreadCount: number }> {
    return this.http.get<{ unreadCount: number }>(`${this.apiUrl}/notifications/${userId}/count`);
  }
  
  // Message endpoints
  sendMessage(complaintId: number, message: { authorId: number; authorRole: string; content: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/${complaintId}/messages`, message);
  }
  
  getMessages(complaintId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${complaintId}/messages`);
  }
}
