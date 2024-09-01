import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:4002/api'; // API 엔드포인트 URL 기본 경로

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<any> {
    const loginData = { username, password };
    return this.http.post<any>(`${this.apiUrl}/auth`, loginData);
  }

  register(newUser: any): Observable<boolean> {
    return this.http.post<boolean>(`${this.apiUrl}/register`, newUser);
  }

  getProfile(): Observable<any> {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      return this.http.get<any>(`${this.apiUrl}/users/${user.id}`);
    }
    return new Observable<any>(); // 서버 환경에서는 빈 Observable 반환
  }

  updateProfile(user: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${user.id}`, user);
  }

  deleteAccount(userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${userId}`);
  }

  isAuthenticated(): boolean {
    return typeof window !== 'undefined' && !!window.sessionStorage.getItem('user');
  }

  getUserRole(): string | null {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const user = sessionStorage.getItem('user');
      return user ? JSON.parse(user).username : null;
      
    }
    return null;
  }

  logout() {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.clear();
    }
  }
}
