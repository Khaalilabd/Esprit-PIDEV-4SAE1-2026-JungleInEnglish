import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CourseEnrollmentService {
  private apiUrl = `${environment.apiUrl}/enrollments`;

  constructor(private http: HttpClient) {}

  // FIX 1: Unenroll student from course
  unenrollStudent(studentId: number, courseId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/student/${studentId}/course/${courseId}`);
  }
}
