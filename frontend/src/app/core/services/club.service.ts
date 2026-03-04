import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { Club, CreateClubRequest, UpdateClubRequest, Member, JoinClubRequest, ClubCategory } from '../models/club.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClubService {
  private apiUrl = `${environment.apiUrl}/clubs`;
  
  // Subject to notify when user joins or leaves a club
  private clubMembershipChanged = new Subject<void>();
  public clubMembershipChanged$ = this.clubMembershipChanged.asObservable();

  constructor(private http: HttpClient) {}
  
  // Method to notify that club membership has changed
  notifyClubMembershipChanged(): void {
    this.clubMembershipChanged.next();
  }

  getAllClubs(): Observable<Club[]> {
    return this.http.get<Club[]>(this.apiUrl);
  }

  getClubById(id: number): Observable<Club> {
    return this.http.get<Club>(`${this.apiUrl}/${id}`);
  }

  getClubsByCategory(category: ClubCategory): Observable<Club[]> {
    return this.http.get<Club[]>(`${this.apiUrl}/category/${category}`);
  }

  getAvailableClubs(): Observable<Club[]> {
    return this.http.get<Club[]>(`${this.apiUrl}/available`);
  }

  createClub(club: CreateClubRequest): Observable<Club> {
    return this.http.post<Club>(this.apiUrl, club);
  }

  updateClub(id: number, club: UpdateClubRequest, userId: number): Observable<Club> {
    return this.http.put<Club>(`${this.apiUrl}/${id}?requesterId=${userId}`, club);
  }

  deleteClub(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getClubMembers(clubId: number): Observable<Member[]> {
    return this.http.get<Member[]>(`${environment.apiUrl}/members/club/${clubId}`);
  }

  joinClub(clubId: number, request: JoinClubRequest): Observable<Member> {
    return this.http.post<Member>(`${this.apiUrl}/${clubId}/join`, request);
  }

  leaveClub(clubId: number, userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${clubId}/leave/${userId}`);
  }

  updateMemberRank(clubId: number, memberId: number, rank: string): Observable<Member> {
    return this.http.patch<Member>(`${this.apiUrl}/${clubId}/members/${memberId}/rank`, { rank });
  }

  // Méthodes pour le workflow d'approbation
  getPendingClubs(): Observable<Club[]> {
    return this.http.get<Club[]>(`${this.apiUrl}/pending`);
  }

  getApprovedClubs(): Observable<Club[]> {
    return this.http.get<Club[]>(`${this.apiUrl}/approved`);
  }

  getClubsByUser(userId: number): Observable<Club[]> {
    return this.http.get<Club[]>(`${this.apiUrl}/user/${userId}`);
  }

  approveClub(clubId: number, reviewerId: number, comment?: string): Observable<Club> {
    const params = new HttpParams()
      .set('reviewerId', reviewerId.toString())
      .set('comment', comment || '');
    return this.http.post<Club>(`${this.apiUrl}/${clubId}/approve`, null, { params });
  }

  rejectClub(clubId: number, reviewerId: number, comment?: string): Observable<Club> {
    const params = new HttpParams()
      .set('reviewerId', reviewerId.toString())
      .set('comment', comment || '');
    return this.http.post<Club>(`${this.apiUrl}/${clubId}/reject`, null, { params });
  }

  suspendClub(clubId: number, managerId: number, reason: string): Observable<Club> {
    const params = new HttpParams()
      .set('managerId', managerId.toString())
      .set('reason', reason);
    return this.http.post<Club>(`${this.apiUrl}/${clubId}/suspend`, null, { params });
  }

  activateClub(clubId: number, managerId: number): Observable<Club> {
    const params = new HttpParams()
      .set('managerId', managerId.toString());
    return this.http.post<Club>(`${this.apiUrl}/${clubId}/activate`, null, { params });
  }
}
