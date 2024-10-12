import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';  // FormsModule 추가
import { NavBarComponent } from '../nav-bar/nav-bar.component';

@Component({
  selector: 'app-user-management',
  standalone: true,  // standalone 컴포넌트로 설정
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css'],
  imports: [CommonModule, FormsModule, NavBarComponent]  // CommonModule과 FormsModule 추가
})
export class UserManagementComponent {
  users: any[] = [];

  constructor(private http: HttpClient) {
    this.loadUsers();
  }

  loadUsers() {
    // MongoDB API 호출
    this.http.get<any[]>('http://localhost:4002/api/users').subscribe(data => {
      // 각 유저별로 selectedRole 필드를 추가
      this.users = data.map(user => ({ ...user, selectedRole: '' }));  // 모든 사용자 로드
      console.log('Loaded users:', this.users); // 로드된 사용자 정보 로그
    }, error => {
      console.error('Error loading users:', error);
    });
  }

  // 사용자를 삭제하는 메서드 (Group Admin과 User만 삭제 가능)
  removeUser(user: any) {
    if (user.roles.includes('Group Admin') || user.roles.includes('User')) {
      if (confirm(`Are you sure you want to delete ${user.username}?`)) {
        this.http.delete(`http://localhost:4002/api/super-admin/delete/${user._id}`).subscribe(() => {
          alert('User deleted successfully');
          this.loadUsers();  // 목록 다시 불러오기
        });
      }
    } else {
      alert('You cannot delete a Super Admin.');
    }
  }

// 역할 변경 요청 (각 유저의 selectedRole 사용)
changeUserRole(user: any) {
  if (user.selectedRole) {
    this.http.put(`http://localhost:4002/api/super-admin/promote/${user._id}`, { newRole: user.selectedRole })
      .subscribe({
        next: () => {
          alert('Promotion request sent to the user.');
          this.loadUsers();  // 사용자 목록 다시 불러오기
        },
        error: (error) => {
          console.error('Error changing user role:', error);
        }
      });
  } else {
    alert('Please select a role.');
  }
}
}
