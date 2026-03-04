import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  StudentCaseCard, 
  StudentCaseDetail, 
  TeachingQualityDashboard,
  AcademicActionType,
  ResolutionFeedback
} from '../models/student-case.model';

@Injectable({
  providedIn: 'root'
})
export class StudentCaseService {
  private apiUrl = 'http://localhost:8088/api/student-cases';

  constructor(private http: HttpClient) {}

  getAllStudentCases(): Observable<StudentCaseCard[]> {
    return this.http.get<StudentCaseCard[]>(this.apiUrl);
  }

  getStudentCaseDetail(complaintId: number): Observable<StudentCaseDetail> {
    return this.http.get<StudentCaseDetail>(`${this.apiUrl}/${complaintId}`);
  }

  submitStudentFeedback(complaintId: number, feedback: ResolutionFeedback, comment: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${complaintId}/feedback`, { feedback, comment });
  }

  assignAcademicAction(
    complaintId: number, 
    actionType: AcademicActionType, 
    details: string, 
    assignedBy: number,
    assignedTo?: number
  ): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${complaintId}/actions`, {
      actionType,
      details,
      assignedBy,
      assignedTo
    });
  }

  addTimelineEvent(complaintId: number, description: string, actorId: number, actorRole: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${complaintId}/timeline`, {
      description,
      actorId,
      actorRole
    });
  }

  getTeachingQualityDashboard(): Observable<TeachingQualityDashboard> {
    return this.http.get<TeachingQualityDashboard>(`${this.apiUrl}/teaching-quality-dashboard`);
  }
}
