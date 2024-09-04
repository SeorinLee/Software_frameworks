import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:4002/api'; // API 엔드포인트 URL 기본 경로

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) {}

  login(username: string, password: string): Observable<any> {
    const loginData = { username, password };
    return this.http.post<any>(`${this.apiUrl}/auth`, loginData);
  }

  register(newUser: any): Observable<boolean> {
    return this.http.post<boolean>(`${this.apiUrl}/register`, newUser);
  }

  getProfile(): Observable<any> {
    const user = this.getStoredUser();
    if (user && user.id) {
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
    return !!this.getStoredUser();  // localStorage와 sessionStorage 모두 확인
  }

  getUserRole(): string | null {
    const user = this.getStoredUser();
    return user ? user.username : null;
  }

  getStoredUser(): any | null {
    if (isPlatformBrowser(this.platformId)) {
      const user = localStorage.getItem('user') || sessionStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  }  

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
    }
  }
}