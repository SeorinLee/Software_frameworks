import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavBarComponent } from '../nav-bar/nav-bar.component';

@Component({
  selector: 'app-group-list',
  standalone: true,
  templateUrl: './group-list.component.html',
  styleUrls: ['./group-list.component.css'],
  imports: [CommonModule, NavBarComponent]
})
export class GroupListComponent implements OnInit {
  groups: any[] = [];
  userGroups: any[] = [];
  userRoles: string[] = [];
  userId: string = ''; // 현재 사용자의 ID

  constructor(private http: HttpClient, private authService: AuthService, private router: Router) {}

  ngOnInit() {
    const user = this.authService.getStoredUser();
    if (user) {
      this.userRoles = user.roles;
      this.userGroups = user.groups; // 사용자가 가입한 그룹 목록
      this.userId = user.id; // 현재 사용자의 ID 저장
    }
    this.loadGroups();
  }

  // 모든 그룹 불러오기
  loadGroups() {
    this.http.get<any[]>('http://localhost:4002/api/groups').subscribe({
      next: (data) => {
        // Super Admin 또는 Group Admin은 본인이 생성한 그룹을 제외하고 필터링
        if (this.userRoles.includes('Super Admin') || this.userRoles.includes('Group Admin')) {
          this.groups = data.filter(group => group.creatorId !== this.userId);
        } 
        // 일반 사용자는 본인이 가입하지 않은 그룹만 필터링
        else if (this.userRoles.includes('User')) {
          this.groups = data.filter(group => 
            !this.userGroups.some(userGroup => userGroup.groupId === group.id)
          );
        }
      },
      error: (error) => {
        console.error('그룹 로드 중 오류 발생:', error);
      }
    });
  }

// 그룹 가입 요청 처리
// 그룹 가입 요청 처리
joinGroup(groupId: string, creatorRole: string) {
  const user = this.authService.getStoredUser();

  // Super Admin은 즉시 가입
  if (this.userRoles.includes('Super Admin')) {
    this.http.post(`http://localhost:4002/api/groups/${groupId}/join`, { userId: user.id }).subscribe({
      next: () => {
        alert('Successfully joined the group as Super Admin.');
        this.loadGroups();  // 그룹 목록을 다시 불러와 화면을 갱신
      },
      error: (error) => {
        console.error('Error joining group:', error);
      }
    });
  } 
  // Group Admin은 승인 필요
  else if (this.userRoles.includes('Group Admin') && (creatorRole === 'Super Admin' || creatorRole === 'Group Admin')) {
    alert('Your request to join the group has been sent to the group admin.');
    this.http.post(`http://localhost:4002/api/groups/${groupId}/join`, { userId: user.id }).subscribe({
      next: () => {
        alert('Join request sent successfully.');
        this.loadGroups();  // 그룹 목록을 다시 불러와 화면을 갱신
      },
      error: (error) => {
        console.error('Error sending join request:', error);
      }
    });
  } 
  // 일반 사용자는 승인 필요
  else if (this.userRoles.includes('User')) {
    alert('Your request to join the group has been sent to the group admin.');
    this.http.post(`http://localhost:4002/api/groups/${groupId}/join`, { userId: user.id }).subscribe({
      next: () => {
        alert('Join request sent successfully.');
        this.loadGroups();  // 그룹 목록을 다시 불러와 화면을 갱신
      },
      error: (error) => {
        console.error('Error sending join request:', error);
      }
    });
  }
}


  // 그룹 상세 페이지로 이동
  navigateToGroup(groupId: string) {
    this.router.navigate([`/groups/${groupId}`]);
  }
}
