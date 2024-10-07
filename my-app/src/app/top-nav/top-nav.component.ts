import { Component } from '@angular/core';
import { AuthService } from '../auth.service'; // AuthService를 통해 유저 타입 확인
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common'; // CommonModule 추가
import { RouterModule } from '@angular/router'; // RouterModule 추가

@Component({
  selector: 'app-top-nav',
  standalone: true,  // standalone 컴포넌트로 설정
  templateUrl: './top-nav.component.html',
  styleUrls: ['./top-nav.component.css'],
  imports: [CommonModule, RouterModule] // CommonModule과 RouterModule 추가
})
export class TopNavComponent {
  userType: string = '';
  dashboardRoute: string = ''; // 대시보드 경로를 저장할 변수

  constructor(private authService: AuthService, private router: Router) {
    const user = this.authService.getStoredUser();
    if (user) {
      this.userType = user.roles[0];  // Super Admin, Group Admin, User 등의 역할 설정
      this.setDashboardRoute(); // 대시보드 경로 설정
    }
  }

  // 대시보드 경로를 설정하는 함수
  setDashboardRoute() {
    if (this.userType === 'Super Admin') {
      this.dashboardRoute = '/super-admin';
    } else if (this.userType === 'Group Admin') {
      this.dashboardRoute = '/group-admin';
    } else if (this.userType === 'User') {
      this.dashboardRoute = '/user-dashboard';
    }
  }

  // 네비게이션 링크 조건에 따라 렌더링
  isSuperAdmin(): boolean {
    return this.userType === 'Super Admin';
  }

  isGroupAdmin(): boolean {
    return this.userType === 'Group Admin';
  }

  isUser(): boolean {
    return this.userType === 'User';
  }
}
