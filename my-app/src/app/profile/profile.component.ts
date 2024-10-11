import { Component, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../auth.service'; 

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, HttpClientModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent {
  user: any = { id: '', username: '', email: '', firstName: '', lastName: '' };

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,  // AuthService 주입
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      const storedUser = this.authService.getStoredUser();  // AuthService의 메서드를 사용
      if (!storedUser) {
        this.router.navigate(['/login']);  // 인증되지 않았으면 로그인 페이지로 이동
      } else {
        this.user = storedUser;
        console.log(`Loaded user with ID: ${this.user.id}, Username: ${this.user.username}`);
      }
    }
  }

  onSaveProfile() {
    if (isPlatformBrowser(this.platformId)) {
      const updatedUser = { ...this.user };

      // 파일 업로드 제거, 단순 데이터 전송
      this.http.put(`http://localhost:4002/api/users/${this.user.id}`, updatedUser).subscribe({
        next: () => {
          alert('Profile updated successfully!');
          sessionStorage.setItem('user', JSON.stringify(updatedUser));
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to update profile:', error);
          this.handleError(error);
        }
      });
    }
  }

  onDeleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      if (isPlatformBrowser(this.platformId)) {
        console.log(`Deleting user with ID: ${this.user.id}`);  // 추가: ID 확인
        this.http.delete(`http://localhost:4002/api/users/delete/${this.user.id}`).subscribe({
          next: () => {
            alert('Account deleted successfully!');
            sessionStorage.clear();
            this.router.navigate(['/login']);
          },
          error: (error: HttpErrorResponse) => {
            console.error('Failed to delete account:', error);
            alert('Failed to delete account. Please try again later.');
          }
        });
      }
    }
  }
  
  // Back 버튼 클릭 시 실행되는 메서드
  onBack() {
    const role = this.authService.getUserRole();  // 사용자 역할 정보를 AuthService에서 가져옴

    if (role === 'Super Admin') {
      this.router.navigate(['/super-admin']);  // super-admin 페이지로 이동
    } else if (role === 'Group Admin') {
      this.router.navigate(['/group-admin']);  // group-admin 페이지로 이동
    } else {
      this.router.navigate(['/user-dashboard']);  // 기본적으로 일반 유저는 user-dashboard로 이동
    }
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Client-side error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Server-side error: ${error.status} ${error.message}`;
    }
    alert(errorMessage);
  }
}