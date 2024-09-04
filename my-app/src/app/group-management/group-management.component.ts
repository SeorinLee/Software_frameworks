import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-group-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './group-management.component.html',
  styleUrls: ['./group-management.component.css']
})
export class GroupManagementComponent {
  groupAdmins: any[] = [];  // 빈 배열로 초기화하여 undefined 에러 방지

  constructor(private http: HttpClient) {
    this.loadGroupAdmins();  // 컴포넌트 초기화 시 데이터 로드
  }

  // 그룹 관리자 목록을 로드하는 함수
  loadGroupAdmins() {
    this.http.get<any[]>('http://localhost:4002/api/users').subscribe(data => {
      this.groupAdmins = data.filter(user => user.roles.includes('Group Admin'));  // 그룹 관리자 필터링
    });
  }

  // 그룹 관리자를 Super Admin으로 승격 요청
  promoteToSuperAdmin(userId: string) {
    this.http.put(`http://localhost:4002/api/super-admin/promote/${userId}`, { newRole: 'Super Admin' }).subscribe({
      next: () => {
        alert('Promotion request sent to the Group Admin. They need to accept it in notifications.');
        this.loadGroupAdmins();  // 목록을 다시 불러옴
      },
      error: (error) => {
        console.error('Promotion request failed:', error);
        alert('Failed to send promotion request. Please try again.');
      }
    });
  }

  // 그룹 관리자를 삭제하는 함수
  removeGroupAdmin(userId: string) {
    if (confirm('Are you sure you want to delete this Group Admin?')) {
      this.http.delete(`http://localhost:4002/api/super-admin/delete/${userId}`).subscribe(() => {
        alert('Group Admin deleted successfully');
        this.loadGroupAdmins();  // 목록을 다시 불러옴
      });
    }
  }
}
