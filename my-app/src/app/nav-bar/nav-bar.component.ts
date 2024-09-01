import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.css']
})
export class NavBarComponent {
  constructor(private authService: AuthService, private router: Router) {}

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  deleteAccount() {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (user && user.id) {  // 세션에 유저 정보가 있는지 확인
      if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        this.authService.deleteAccount(user.id).subscribe(() => {
          alert('Account deleted successfully!');
          this.authService.logout();  // 세션을 지우고 로그인 페이지로 이동
          this.router.navigate(['/login']);
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
      this.router.navigate(['/profile']);  // 프로필 페이지로 라우팅
    } else {
      alert('No user found. Please log in again.');
      //this.router.navigate(['/login']);  // 유저 정보가 없으면 로그인 페이지로 이동
    }
  }
}
