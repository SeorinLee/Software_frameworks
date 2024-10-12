import { Component, OnInit } from '@angular/core';
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
export class NavBarComponent implements OnInit {
  user: any = null; // 사용자 정보를 null로 초기화

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.loadUserDetails();

    this.authService.userProfileUpdated.subscribe((updatedUser: any) => {
      this.user = updatedUser; // 프로필이 업데이트되면 사용자 정보 갱신
      console.log('Updated user details:', this.user); // 업데이트된 사용자 정보 로그
    });
  }

  loadUserDetails() {
    this.user = this.authService.getStoredUser(); // 사용자 정보 가져오기
    if (!this.user) {
      console.warn('No user found. Redirecting to login.'); // 사용자 정보가 없을 때 경고 로그
      this.router.navigate(['/login']); // 사용자 정보가 없으면 로그인 페이지로 리디렉션
    } else {
      console.log('Loaded user details:', this.user); // 로드된 사용자 정보 로그
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  deleteAccount() {
    const userId = this.user?._id; // null 체크 추가
    if (userId) {
      if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        this.authService.deleteAccount(userId).subscribe({
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
    const userId = this.user?._id; // null 체크 추가
    if (userId) {
      this.router.navigate(['/profile']);
    } else {
      alert('No user found. Please log in again.');
    }
  }

  isSuperAdmin(): boolean {
    return this.user?.roles?.includes('Super Admin') || false; // null 체크 추가
  }

  isGroupAdmin(): boolean {
    return this.user?.roles?.includes('Group Admin') || false; // null 체크 추가
  }
}
