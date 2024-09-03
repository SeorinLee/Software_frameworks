import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';  // CommonModule 임포트

@Component({
  selector: 'app-group-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './group-management.component.html',
  styleUrls: ['./group-management.component.css']
})
export class GroupManagementComponent {
  groupAdmins: any[] = [];

  constructor(private http: HttpClient) {
    this.loadGroupAdmins();
  }

  loadGroupAdmins() {
    this.http.get<any[]>('http://localhost:4002/api/users').subscribe(data => {
      this.groupAdmins = data.filter(user => user.roles.includes('Group Admin'));
    });
  }

  promoteToSuperAdmin(userId: string) {
    this.http.put(`http://localhost:4002/api/super-admin/promote/${userId}`, { newRole: 'Super Admin' }).subscribe(() => {
      alert('User promoted to Super Admin');
      this.loadGroupAdmins();
    });
  }

  removeGroupAdmin(userId: string) {
    if (confirm('Are you sure you want to delete this Group Admin?')) {
      this.http.delete(`http://localhost:4002/api/super-admin/delete/${userId}`).subscribe(() => {
        alert('Group Admin deleted successfully');
        this.loadGroupAdmins();
      });
    }
  }
}
