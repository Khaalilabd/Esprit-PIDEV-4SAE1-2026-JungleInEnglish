import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;  // Via API Gateway
  private currentUserSubject = new BehaviorSubject<AuthResponse | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    const storedUser = localStorage.getItem('currentUser');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      const user = JSON.parse(storedUser);
      this.currentUserSubject.next(user);
      
      // Don't auto-load fresh data on startup to avoid CORS issues
      // Fresh data will be loaded when visiting settings page
      console.log('🚀 App startup - User loaded from localStorage');
    }
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request).pipe(
      tap(response => {
        this.setCurrentUser(response);
      })
    );
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(response => {
        console.log('🔐 Login response from backend:', response);
        console.log('📸 Profile photo from login:', response.profilePhoto);
        this.setCurrentUser(response);
        // Load fresh user data after login to ensure we have the latest profile photo
        setTimeout(() => {
          console.log('⏰ Loading fresh user data after login...');
          this.loadFreshUserData(response.id);
        }, 500);
      })
    );
  }

  loadFreshUserData(userId: number): void {
    // Don't load if no valid token
    const token = this.getToken();
    if (!token || token.split('.').length !== 3) {
      console.log('⚠️ Skipping loadFreshUserData - no valid JWT token');
      return;
    }
    
    console.log('🔄 Fetching fresh user data for ID:', userId);
    this.http.get<any>(`http://localhost:8088/api/users/${userId}`).subscribe({
      next: (userData) => {
        console.log('✅ Fresh user data received:', userData);
        console.log('📸 Fresh profile photo:', userData.profilePhoto);
        const currentUser = this.currentUserValue;
        if (currentUser) {
          // IMPORTANT: Préserver le token existant car le backend ne le renvoie pas
          const updatedUser: AuthResponse = {
            ...currentUser,
            ...userData,
            token: currentUser.token, // Préserver le token existant
            refreshToken: currentUser.refreshToken // Préserver le refreshToken existant
          };
          console.log('💾 Updating localStorage with fresh data');
          this.updateCurrentUser(updatedUser);
          console.log('✨ User data updated successfully');
        }
      },
      error: (error) => {
        console.error('❌ Failed to load fresh user data after login:', error);
      }
    });
  }

  logout(): Observable<void> {
    return new Observable(observer => {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      this.currentUserSubject.next(null);
      observer.next();
      observer.complete();
    });
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh-token`, { refreshToken }).pipe(
      tap(response => {
        this.setCurrentUser(response);
        // Load fresh user data after token refresh
        this.loadFreshUserData(response.id);
      })
    );
  }

  private setCurrentUser(user: AuthResponse): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('token', user.token);
    if (user.refreshToken) {
      localStorage.setItem('refreshToken', user.refreshToken);
    }
    this.currentUserSubject.next(user);
  }

  get currentUserValue(): AuthResponse | null {
    return this.currentUserSubject.value;
  }

  updateCurrentUser(user: AuthResponse): void {
    console.log('💾 updateCurrentUser called with:', user);
    console.log('📸 Photo URL being saved:', user.profilePhoto);
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
    console.log('✅ localStorage updated, currentUser emitted');
  }

  get isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  hasRole(roles: string[]): boolean {
    const currentUser = this.currentUserValue;
    return currentUser ? roles.includes(currentUser.role) : false;
  }

  getUserRole(): string | null {
    const currentUser = this.currentUserValue;
    return currentUser ? currentUser.role : null;
  }

  getToken(): string | null {
    const token = localStorage.getItem('token');
    console.log('🎫 getToken called - Token:', token ? `${token.substring(0, 20)}...` : 'null');
    return token;
  }

  requestPasswordReset(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/password-reset/request`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/password-reset/confirm`, { token, newPassword });
  }

  activateAccount(token: string): Observable<AuthResponse> {
    // Utiliser l'endpoint activate-api qui retourne un AuthResponse avec le token
    return this.http.get<AuthResponse>(`${this.apiUrl}/activate-api?token=${token}`).pipe(
      tap(response => {
        this.setCurrentUser(response);
        // Load fresh user data after activation
        this.loadFreshUserData(response.id);
      })
    );
  }

  updateProfile(data: any): Observable<AuthResponse> {
    const currentUser = this.currentUserValue;
    if (!currentUser) {
      throw new Error('No user logged in');
    }
    
    // Utiliser l'endpoint /api/users/{id} via API Gateway
    return this.http.put<AuthResponse>(`http://localhost:8088/api/users/${currentUser.id}`, data).pipe(
      tap(response => {
        // Mettre à jour le currentUser avec les nouvelles données
        // IMPORTANT: Préserver le token existant car le backend ne le renvoie pas
        const updated: AuthResponse = {
          ...currentUser,
          ...response,
          token: currentUser.token, // Préserver le token existant
          refreshToken: currentUser.refreshToken // Préserver le refreshToken existant
        };
        // Utiliser updateCurrentUser au lieu de setCurrentUser pour ne pas écraser le token
        this.updateCurrentUser(updated);
      })
    );
  }

  getAllUsers(): Observable<any[]> {
    // Appel via API Gateway (architecture microservices correcte)
    return this.http.get<any[]>('http://localhost:8088/public/users');
  }

  uploadProfilePhoto(userId: number, formData: FormData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`http://localhost:8088/api/users/${userId}/profile-photo`, formData).pipe(
      tap(response => {
        const currentUser = this.currentUserValue;
        if (currentUser) {
          // IMPORTANT: Préserver le token existant car le backend ne le renvoie pas
          const updated: AuthResponse = {
            ...currentUser,
            profilePhoto: response.profilePhoto,
            token: currentUser.token, // Préserver le token existant
            refreshToken: currentUser.refreshToken // Préserver le refreshToken existant
          };
          // Utiliser updateCurrentUser au lieu de setCurrentUser
          this.updateCurrentUser(updated);
        }
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    const currentUser = this.currentUserValue;
    if (!currentUser) {
      throw new Error('No user logged in');
    }
    
    return this.http.post(`http://localhost:8088/api/users/${currentUser.id}/change-password`, {
      currentPassword,
      newPassword
    });
  }
}

