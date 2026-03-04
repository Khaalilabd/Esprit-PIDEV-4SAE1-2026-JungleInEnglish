import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ExamSummary,
  ExamDetail,
  ExamLevel,
  ExamAttemptWithExam,
  ExamAttempt,
  SaveAnswersRequest,
  ExamResult,
  ResultWithReview
} from '../models/exam.model';

@Injectable({
  providedIn: 'root'
})
export class ExamService {
  private apiUrl = `${environment.apiUrl}/exams`;
  private attemptUrl = `${environment.apiUrl}/exam-attempts`;
  private resultUrl = `${environment.apiUrl}/exam-results`;

  constructor(private http: HttpClient) {}

  // Exam Management
  getAllExams(): Observable<ExamSummary[]> {
    return this.http.get<ExamSummary[]>(this.apiUrl);
  }

  createExam(exam: any): Observable<ExamSummary> {
    return this.http.post<ExamSummary>(this.apiUrl, exam);
  }

  updateExam(id: string, exam: any): Observable<ExamSummary> {
    return this.http.put<ExamSummary>(`${this.apiUrl}/${id}`, exam);
  }

  deleteExam(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  publishExam(id: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/publish`, {});
  }

  unpublishExam(id: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/unpublish`, {});
  }

  getExamById(id: string): Observable<ExamDetail> {
    return this.http.get<ExamDetail>(`${this.apiUrl}/${id}`);
  }

  getPublishedExams(level?: ExamLevel): Observable<ExamSummary[]> {
    let params = new HttpParams();
    if (level) {
      params = params.set('level', level);
    }
    return this.http.get<ExamSummary[]>(`${this.apiUrl}/published`, { params });
  }

  // Student Exam Taking
  startExam(userId: number, level: ExamLevel): Observable<ExamAttemptWithExam> {
    const params = new HttpParams()
      .set('userId', userId.toString())
      .set('level', level);
    return this.http.post<ExamAttemptWithExam>(`${this.attemptUrl}/start`, null, { params });
  }

  getAttempt(attemptId: string, userId: number): Observable<ExamAttemptWithExam> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.get<ExamAttemptWithExam>(`${this.attemptUrl}/${attemptId}`, { params });
  }

  saveAnswers(attemptId: string, userId: number, answers: SaveAnswersRequest): Observable<void> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.post<void>(`${this.attemptUrl}/${attemptId}/answers`, answers, { params });
  }

  submitExam(attemptId: string, userId: number): Observable<ExamAttempt> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.post<ExamAttempt>(`${this.attemptUrl}/${attemptId}/submit`, null, { params });
  }

  getUserAttempts(userId: number): Observable<ExamAttempt[]> {
    return this.http.get<ExamAttempt[]>(`${this.attemptUrl}/user/${userId}`);
  }

  // Results
  getResultByAttemptId(attemptId: string, userId: number): Observable<ExamResult> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.get<ExamResult>(`${this.resultUrl}/attempt/${attemptId}`, { params });
  }

  getResultWithReview(attemptId: string, userId: number): Observable<ResultWithReview> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.get<ResultWithReview>(`${this.resultUrl}/attempt/${attemptId}/review`, { params });
  }

  getUserResults(userId: number): Observable<ExamResult[]> {
    return this.http.get<ExamResult[]>(`${this.resultUrl}/student/${userId}`);
  }

  deleteAttempt(attemptId: string, userId: number): Observable<void> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.delete<void>(`${this.attemptUrl}/${attemptId}`, { params });
  }

  // Part Management
  createPart(examId: string, part: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/exam-parts/exam/${examId}`, part);
  }

  updatePart(partId: string, part: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/exam-parts/${partId}`, part);
  }

  deletePart(partId: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/exam-parts/${partId}`);
  }

  // Question Management
  createQuestion(partId: string, question: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/questions/part/${partId}`, question);
  }

  updateQuestion(questionId: string, question: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/questions/${questionId}`, question);
  }

  deleteQuestion(questionId: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/questions/${questionId}`);
  }

  // Grading Management
  getPendingGrading(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/grading/attempts/pending`);
  }

  getAllSubmittedAttempts(): Observable<ExamAttempt[]> {
    return this.http.get<ExamAttempt[]>(`${this.attemptUrl}/submitted`);
  }

  getAttemptsByStatus(status: string): Observable<ExamAttempt[]> {
    return this.http.get<ExamAttempt[]>(`${this.attemptUrl}/status/${status}`);
  }

  gradeAnswer(answerId: string, graderId: number, gradeData: any): Observable<void> {
    const params = new HttpParams().set('graderId', graderId.toString());
    return this.http.post<void>(`${environment.apiUrl}/grading/answers/${answerId}`, gradeData, { params });
  }

  finalizeGrading(attemptId: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/grading/attempts/${attemptId}/finalize`, {});
  }
}
