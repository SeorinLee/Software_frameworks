import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';  // CommonModule 임포트

@Component({
  selector: 'app-user-management',
  standalone: true,  // 이 컴포넌트를 standalone 컴포넌트로 설정
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css'],
  imports: [CommonModule]  // CommonModule을 imports에 추가
})
export class UserManagementComponent {
  users: any[] = [];

  constructor(private http: HttpClient) {
    this.loadUsers();
  }

  loadUsers() {
    this.http.get<any[]>('http://localhost:4002/api/users').subscribe(data => {
      this.users = data.filter(user => user.roles.includes('User') && !user.roles.includes('Group Admin') && !user.roles.includes('Super Admin'));
    });
  }

  promoteToGroupAdmin(userId: string) {
    this.http.put(`http://localhost:4002/api/super-admin/promote/${userId}`, { newRole: 'Group Admin' }).subscribe(() => {
      alert('User promoted to Group Admin');
      this.loadUsers();
    });
  }

  removeUser(userId: string) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.http.delete(`http://localhost:4002/api/super-admin/delete/${userId}`).subscribe(() => {
        alert('User deleted successfully');
        this.loadUsers();
      });
    }
  }
}
