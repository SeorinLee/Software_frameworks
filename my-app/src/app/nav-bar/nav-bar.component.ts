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
  firstName: string = '';
  lastName: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {  // 컴포넌트가 로드될 때 사용자 정보 로드
    this.loadUserDetails();
  }

  loadUserDetails() {
    const user = this.authService.getStoredUser(); // 저장된 사용자 정보 가져오기
    if (user) {
      this.firstName = user.firstName || ''; // firstName 값 할당
      this.lastName = user.lastName || '';   // lastName 값 할당
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
    if (user && user.id) {
      this.router.navigate(['/profile']);
    } else {
      alert('No user found. Please log in again.');
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
