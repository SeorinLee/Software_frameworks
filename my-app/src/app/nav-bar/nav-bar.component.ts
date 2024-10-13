import { Component, OnInit } from '@angular/core'; // OnInit 인터페이스 추가
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.css'],
  imports: [CommonModule, RouterModule]
})
export class NavBarComponent implements OnInit {  // OnInit 인터페이스 구현

  user: any = {};  // user 속성 정의


  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.loadUserDetails();

    // 프로필 업데이트 이벤트를 구독하여 사용자 정보 갱신
    this.authService.userProfileUpdated.subscribe((updatedUser: any) => {
      this.user = updatedUser; // 업데이트된 사용자 정보 반영
      this.user.profilePictureUrl = this.user.profilePictureUrl 
        ? `http://localhost:4002${this.user.profilePictureUrl}` 
        : 'images/chatlogo.png';  // 기본 프로필 사진 설정
      console.log('Updated user details:', this.user); // 업데이트된 사용자 정보 로그
    });
  }

  loadUserDetails() {
    this.user = this.authService.getStoredUser(); // 사용자 정보 가져오기
    if (!this.user) {
      console.warn('No user found. Redirecting to login.'); // 사용자 정보가 없을 때 경고 로그
      this.router.navigate(['/login']); // 사용자 정보가 없으면 로그인 페이지로 리디렉션
    } else {
      // 프로필 사진 URL을 서버 경로로 설정
      this.user.profilePictureUrl = this.user.profilePictureUrl 
        ? `http://localhost:4002${this.user.profilePictureUrl}` 
        : 'images/chatlogo.png';  // 기본 프로필 사진 설정
      console.log('Loaded user details:', this.user); // 로드된 사용자 정보 로그
    }
  }
  

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  deleteAccount() {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (user && user.id) {
      if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        this.authService.deleteAccount(user.id).subscribe({
          next: () => {
            alert('Account deleted successfully!');
            this.authService.logout();
            this.router.navigate(['/login']);
          },
          error: (err) => {
            console.error('Failed to delete account:', err);
            alert('Failed to delete account. Please try again later.');
          }
        });
      }
    } else {
      alert('No user found. Please log in again.');
      this.router.navigate(['/login']);
    }
  }  

  navigateToProfile() {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    console.log('Retrieved user from sessionStorage:', user);  // 세션에서 가져온 사용자 정보 출력
    if (user && user._id) {
      this.router.navigate(['/profile']);
    } else {
      console.log('No user found in sessionStorage.');  // 세션에 사용자가 없는 경우
      alert('No user found. Please log in again.');
      this.router.navigate(['/login']);
    }
  }
  

  isSuperAdmin(): boolean {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    return user && user.roles && user.roles.includes('Super Admin');
  }

  isGroupAdmin(): boolean {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    return user && user.roles && user.roles.includes('Group Admin');
  }
}
