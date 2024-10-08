import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-my-joined-groups',
  standalone: true,
  templateUrl: './my-joined-groups.component.html',
  styleUrls: ['./my-joined-groups.component.css'],
  imports: [CommonModule]
})
export class MyJoinedGroupsComponent implements OnInit {
  joinedGroups: any[] = [];  // 'Accepted' 상태의 그룹을 저장하는 배열
  pendingGroups: any[] = [];  // 'Pending' 상태의 그룹을 저장하는 배열

  constructor(private http: HttpClient, private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.loadJoinedGroups();
  }

  // 가입한 그룹만 불러오는 함수
  loadJoinedGroups() {
    const user = this.authService.getStoredUser();
    this.http.get<any[]>(`http://localhost:4002/api/users/${user.id}/groups`).subscribe({
      next: (data) => {
        if (data) {
          // 'Accepted' 상태인 그룹만 필터링
          this.joinedGroups = data.filter(group => group.status === 'Accepted');
          // 'Pending' 상태인 그룹만 필터링
          this.pendingGroups = data.filter(group => group.status === 'Pending');
        }
      },
      error: (error) => {
        console.error('Error loading joined groups:', error);
      }
    });
  }

  // 그룹 선택 시 그룹 상세 페이지로 이동
  navigateToGroup(groupId: string) {
    this.router.navigate([`/groups/${groupId}`]);  // 그룹 상세 페이지로 라우팅
  }
}
