import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-my-joined-groups',
  standalone: true,
  templateUrl: './my-joined-groups.component.html',
  styleUrls: ['./my-joined-groups.component.css'],
  imports: [CommonModule]
})
export class MyJoinedGroupsComponent implements OnInit {
  joinedGroups: any[] = []; // 그룹 데이터가 여기에 저장됩니다.

  constructor(private http: HttpClient, private authService: AuthService) {}

  ngOnInit() {
    this.loadJoinedGroups();
  }

  loadJoinedGroups() {
    const user = this.authService.getStoredUser();
    this.http.get<any[]>(`http://localhost:4002/api/users/${user.id}/groups`).subscribe({
      next: (data) => {
        console.log('Loaded groups for Super Admin:', data);  // 디버깅용 로그 추가
        if (data) {
          // Super Admin은 모든 그룹 표시
          if (user.roles.includes('Super Admin')) {
            this.joinedGroups = data;  // 그룹 정보가 전체 반환됨 (name, description, status 등)
          } else {
            // Non-Super Admin은 'Accepted' 상태인 그룹만 필터링
            this.joinedGroups = data.filter((group: any) => group.status === 'Accepted');
          }
        }
      },
      error: (error) => {
        console.error('Error loading joined groups:', error);
      }
    });
  }  
  
  
}
