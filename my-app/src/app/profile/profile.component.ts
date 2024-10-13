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
  selectedFile: File | null = null;  // 선택된 파일을 저장할 변수
  profilePictureTimestamp: number = Date.now(); // 프로필 사진 캐시 방지를 위한 타임스탬프 추가
  
  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,  // AuthService 주입
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
  if (isPlatformBrowser(this.platformId)) {
    const storedUser = sessionStorage.getItem('user');
    console.log('Stored user in sessionStorage:', storedUser);  // 세션에서 저장된 사용자 정보 확인
    if (!storedUser) {
      console.log('No user in sessionStorage, navigating to login.');  // 세션에 사용자 정보가 없으면
      this.router.navigate(['/login']);
    } else {
      this.user = JSON.parse(storedUser);
     // 프로필 사진 URL 설정
        
        this.user.profilePictureUrl = this.user.profilePictureUrl 
          ? `http://localhost:4002${this.user.profilePictureUrl}` 
          : 'images/chatlogo.png';  // 기본 프로필 사진 설정
        console.log(`Loaded user with ID: ${this.user.id}`);
      }
    }
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];  // 파일 선택
  }


  onSaveProfile() {
    if (isPlatformBrowser(this.platformId)) {
      const formData = new FormData();
      if (this.selectedFile) {
        formData.append('profilePicture', this.selectedFile);  // 선택된 파일을 폼데이터에 추가
      }
      formData.append('userData', JSON.stringify(this.user));  // 사용자 정보 추가

      this.http.put(`http://localhost:4002/api/users/${this.user._id}/profile`, formData).subscribe({
        next: (response: any) => {
          this.user.profilePictureUrl = response.profilePictureUrl;  // 서버에서 반환된 URL 저장
          sessionStorage.setItem('user', JSON.stringify(this.user));
          alert('Profile updated successfully!');
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
