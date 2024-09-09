import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';  // CommonModule 임포트
import { FormsModule } from '@angular/forms';  // FormsModule 임포트
import { NavBarComponent } from '../nav-bar/nav-bar.component';
import { AuthService } from '../auth.service';  // AuthService 추가
import { Router } from '@angular/router';  // Router 임포트

@Component({
  selector: 'app-chat-group',
  standalone: true,
  templateUrl: './chat-group.component.html',
  styleUrls: ['./chat-group.component.css'],
  imports: [CommonModule, FormsModule, NavBarComponent]  // FormsModule 추가
})
export class ChatGroupComponent {
  groups: any[] = [];
  newGroupName: string = '';
  newGroupDescription: string = '';
  showCreateGroupForm: boolean = false;  

  constructor(private http: HttpClient, private authService: AuthService, private router: Router) {  // Router 추가
    this.loadGroups();
  }

  loadGroups() {
    const headers = { 'user': JSON.stringify(this.authService.getStoredUser()) };
    this.http.get<any[]>('http://localhost:4002/api/groups', { headers }).subscribe(data => {
      this.groups = data;
    });
  }

  // 그룹 생성 후 서버에서 반환된 그룹 ID를 사용
  // 그룹 생성 후 GroupDetailComponent로 라우팅
  createGroup() {
    if (!this.newGroupName || !this.newGroupDescription) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    const user = this.authService.getStoredUser();
    const newGroup = {
      name: this.newGroupName,
      description: this.newGroupDescription,
      creator: user.username
    };

    this.http.post('http://localhost:4002/api/groups', newGroup).subscribe({
      next: (response: any) => {
        const newGroupId = response.id;  // 응답이 `response.id`로 그룹 ID 반환
        this.router.navigate(['/group-detail', newGroupId]); // GroupDetailComponent로 이동
      },
      error: (error) => {
        console.error('그룹 생성 중 오류:', error);
        alert('그룹 생성 중 오류가 발생했습니다.');
      }
    });
  }

  deleteGroup(groupId: string) {
    if (confirm('Are you sure you want to delete this group?')) {
      const user = this.authService.getStoredUser(); // 사용자 정보 가져오기
      const headers = { 'user': JSON.stringify(user) }; // 사용자 정보를 헤더로 전달

      this.http.delete(`http://localhost:4002/api/groups/${groupId}`, { headers }).subscribe(() => {
        alert('Group deleted successfully');
        this.loadGroups();
      }, error => {
        alert(error.error ? error.error.error : 'An error occurred while deleting the group.');
      });
    }
  }

  resetGroupForm() {
    this.newGroupName = '';
    this.newGroupDescription = '';
  }
}
