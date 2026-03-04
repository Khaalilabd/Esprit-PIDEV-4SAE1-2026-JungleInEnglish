import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PackEnrollment } from '../models/pack-enrollment.model';

@Injectable({
  providedIn: 'root'
})
export class PackEnrollmentService {
  private apiUrl = `${environment.apiUrl}/pack-enrollments`;

  constructor(private http: HttpClient) {}

  // Enroll a student in a pack
  enrollStudent(studentId: number, packId: number): Observable<PackEnrollment> {
    const params = new HttpParams()
      .set('studentId', studentId.toString())
      .set('packId', packId.toString());
    
    return this.http.post<PackEnrollment>(this.apiUrl, null, { params });
  }


  // Get all enrollments for a student
  getByStudentId(studentId: number): Observable<PackEnrollment[]> {
    return this.http.get<PackEnrollment[]>(`${this.apiUrl}/student/${studentId}`);
  }

  // Get active enrollments for a student
  getActiveEnrollmentsByStudent(studentId: number): Observable<PackEnrollment[]> {
    return this.http.get<PackEnrollment[]>(`${this.apiUrl}/student/${studentId}/active`);
  }

  // Get all enrollments for a pack
  getByPackId(packId: number): Observable<PackEnrollment[]> {
    return this.http.get<PackEnrollment[]>(`${this.apiUrl}/pack/${packId}`);
  }

  // Get all enrollments for a tutor
  getByTutorId(tutorId: number): Observable<PackEnrollment[]> {
    return this.http.get<PackEnrollment[]>(`${this.apiUrl}/tutor/${tutorId}`);
  }


  // Complete an enrollment
  completeEnrollment(enrollmentId: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${enrollmentId}/complete`, null);
  }


  // Check if student is already enrolled in a pack
  isStudentEnrolled(studentId: number, packId: number): Observable<boolean> {
    const params = new HttpParams()
      .set('studentId', studentId.toString())
      .set('packId', packId.toString());
    
    return this.http.get<boolean>(`${this.apiUrl}/check`, { params });
  }
}
