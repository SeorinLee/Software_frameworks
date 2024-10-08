import { Component } from '@angular/core';
import { AuthService } from '../auth.service'; 
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common'; 
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-top-nav',
  standalone: true,
  templateUrl: './top-nav.component.html',
  styleUrls: ['./top-nav.component.css'],
  imports: [CommonModule, RouterModule]
})
export class TopNavComponent {
  userType: string = '';
  dashboardRoute: string = '';
  selectedGroupId: string = ''; // 선택된 그룹 ID

  constructor(private authService: AuthService, private router: Router) {
    const user = this.authService.getStoredUser();
    if (user) {
      this.userType = user.roles[0];
      this.setDashboardRoute();
      this.setSelectedGroupId(); // 선택된 그룹 ID 설정
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

  // 선택된 그룹 ID를 설정하는 함수
  setSelectedGroupId() {
    // 예시: 현재 유저가 가입한 첫 번째 그룹을 선택
    const user = this.authService.getStoredUser();
    if (user && user.groups && user.groups.length > 0) {
      this.selectedGroupId = user.groups[0].groupId; // 첫 번째 그룹을 선택
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
