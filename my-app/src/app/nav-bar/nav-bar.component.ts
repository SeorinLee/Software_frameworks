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
  firstName: string = '';
  lastName: string = '';
  profileImage: string = ''; // 프로필 이미지 URL 추가

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.loadUserDetails();
  }

  loadUserDetails() {
    const user = this.authService.getStoredUser();
    if (user) {
      this.firstName = user.firstName || '';
      this.lastName = user.lastName || '';
      this.profileImage = user.imageUrl || ''; // 프로필 이미지 URL 할당
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
    const user = JSON.parse(sessionStorage.getItem('user') || '{}'); // 세션 스토리지에서 유저 정보 가져오기
    console.log('User Data:', user); // 유저 정보 로그
  
    // user.id가 있는지 확인
    if (user && user._id) { // MongoDB의 ObjectId를 사용하므로 _id 필드로 체크
      this.router.navigate(['/profile']);
    } else {
      alert('No user found. Please log in again.!!!!');
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
