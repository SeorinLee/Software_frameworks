import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:4002/api'; // API 엔드포인트 URL 기본 경로

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) {}

  // 로그인 메서드 (이메일과 비밀번호로 로그인)
  login(email: string, password: string): Observable<any> {
    const loginData = { email, password };
    return this.http.post<any>(`${this.apiUrl}/auth`, loginData)  // 서버로 로그인 요청
      .pipe(catchError(this.handleError));  // 에러 핸들링 추가
  }

  // 회원가입 메서드
  register(newUser: any): Observable<boolean> {
    return this.http.post<boolean>(`${this.apiUrl}/register`, newUser)
      .pipe(catchError(this.handleError));
  }

  // 그룹 정보 불러오기
  getGroups(): Observable<any> {
    const user = this.getStoredUser();
    if (user) {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'user': JSON.stringify(user) // 헤더에 사용자 정보 추가
      });
      return this.http.get<any[]>(`${this.apiUrl}/groups`, { headers })
        .pipe(catchError(this.handleError));
    } else {
      return throwError(() => new Error('User not authenticated'));
    }
  }

  // 프로필 조회
  getProfile(): Observable<any> {
    const user = this.getStoredUser();
    if (user && user.id) {
      return this.http.get<any>(`${this.apiUrl}/users/${user.id}`)
        .pipe(catchError(this.handleError));
    }
    return throwError(() => new Error('User not authenticated')); // 사용자가 없으면 오류 반환
  }

  // 프로필 업데이트
  updateProfile(user: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${user.id}`, user)
      .pipe(catchError(this.handleError));
  }

  // 사용자 인증 여부 확인
  isAuthenticated(): boolean {
    return !!this.getStoredUser();  // 사용자 정보가 있는지 확인
  }

  // 사용자 역할 정보 조회
  getUserRole(): string | null {
    const user = this.getStoredUser();
    return user?.roles?.[0] || null; // 첫 번째 역할 반환 (예: 'Super Admin')
  }

  // 저장된 사용자 정보 가져오기 (로컬 스토리지나 세션 스토리지에서)
  getStoredUser(): any | null {
    if (isPlatformBrowser(this.platformId)) {
      const user = localStorage.getItem('user') || sessionStorage.getItem('user');
      return user ? JSON.parse(user) : null; // JSON 파싱
    }
    return null;  // 서버 환경에서는 사용자 정보 없음
  }

  // 사용자 정보 저장 (세션/로컬 스토리지에 저장)
  storeUser(user: any, useLocalStorage: boolean = false): void {
    if (isPlatformBrowser(this.platformId)) {
      const userString = JSON.stringify(user);
      useLocalStorage ? localStorage.setItem('user', userString) : sessionStorage.setItem('user', userString);
    }
  }

  // 로그아웃 (사용자 정보 삭제)
  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
    }
  }

  // 계정 삭제
  deleteAccount(userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/delete/${userId}`)
      .pipe(catchError(this.handleError));
  }

  // 공통 오류 처리
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Client-side error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Server-side error: ${error.status} - ${error.message}`;
    }
    console.error('Error occurred:', errorMessage, 'Details:', error);
    return throwError(() => new Error(errorMessage));  // throwError 사용
  }
}
