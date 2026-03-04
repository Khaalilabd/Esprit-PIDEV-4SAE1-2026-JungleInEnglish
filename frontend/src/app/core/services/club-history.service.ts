import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ClubHistory {
  id?: number;
  clubId: number;
  userId: number;
  type: ClubHistoryType;
  action: string;
  description?: string;
  oldValue?: string;
  newValue?: string;
  performedBy?: number;
  performedByName?: string;
  createdAt?: string;
}

export enum ClubHistoryType {
  MEMBER_JOINED = 'MEMBER_JOINED',
  MEMBER_LEFT = 'MEMBER_LEFT',
  MEMBER_REMOVED = 'MEMBER_REMOVED',
  RANK_CHANGED = 'RANK_CHANGED',
  CLUB_CREATED = 'CLUB_CREATED',
  CLUB_UPDATED = 'CLUB_UPDATED',
  CLUB_STATUS_CHANGED = 'CLUB_STATUS_CHANGED',
  EVENT_CREATED = 'EVENT_CREATED',
  EVENT_PARTICIPATED = 'EVENT_PARTICIPATED',
  ACHIEVEMENT_EARNED = 'ACHIEVEMENT_EARNED',
  CONTRIBUTION = 'CONTRIBUTION',
  OTHER = 'OTHER'
}

@Injectable({
  providedIn: 'root'
})
export class ClubHistoryService {
  private apiUrl = `${environment.apiUrl}/clubs/history`;

  constructor(private http: HttpClient) {}

  /**
   * Obtenir l'historique complet d'un club
   */
  getClubHistory(clubId: number): Observable<ClubHistory[]> {
    return this.http.get<ClubHistory[]>(`${this.apiUrl}/club/${clubId}`);
  }

  /**
   * Obtenir l'historique d'un utilisateur dans un club
   */
  getUserHistoryInClub(clubId: number, userId: number): Observable<ClubHistory[]> {
    return this.http.get<ClubHistory[]>(`${this.apiUrl}/club/${clubId}/user/${userId}`);
  }

  /**
   * Obtenir l'historique d'un utilisateur (tous les clubs)
   */
  getUserHistory(userId: number): Observable<ClubHistory[]> {
    return this.http.get<ClubHistory[]>(`${this.apiUrl}/user/${userId}`);
  }

  /**
   * Obtenir l'historique par type
   */
  getHistoryByType(clubId: number, type: ClubHistoryType): Observable<ClubHistory[]> {
    return this.http.get<ClubHistory[]>(`${this.apiUrl}/club/${clubId}/type/${type}`);
  }

  /**
   * Obtenir l'historique récent (derniers X jours)
   */
  getRecentHistory(clubId: number, days: number = 30): Observable<ClubHistory[]> {
    return this.http.get<ClubHistory[]>(`${this.apiUrl}/club/${clubId}/recent?days=${days}`);
  }

  /**
   * Compter les entrées d'historique d'un club
   */
  countClubHistory(clubId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/club/${clubId}/count`);
  }

  /**
   * Compter les entrées d'historique d'un utilisateur dans un club
   */
  countUserHistoryInClub(clubId: number, userId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/club/${clubId}/user/${userId}/count`);
  }

  /**
   * Créer une entrée d'historique
   */
  createHistory(history: ClubHistory): Observable<ClubHistory> {
    return this.http.post<ClubHistory>(this.apiUrl, history);
  }
}
