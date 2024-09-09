import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';  // CommonModule 임포트
import { FormsModule } from '@angular/forms';  // FormsModule 임포트
import { NavBarComponent } from '../nav-bar/nav-bar.component';
import { AuthService } from '../auth.service';  // AuthService 추가

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

  constructor(private http: HttpClient, private authService: AuthService) {  // AuthService DI 추가
    this.loadGroups();
  }

  loadGroups() {
    const headers = { 'user': JSON.stringify(this.authService.getStoredUser()) };
    this.http.get<any[]>('http://localhost:4002/api/groups', { headers }).subscribe(data => {
      this.groups = data;
    });
  }

  createGroup() {
    if (!this.newGroupName || !this.newGroupDescription) {
      alert('All fields are required');
      return;
    }

    const user = this.authService.getStoredUser(); // 현재 로그인한 사용자 정보
    const newGroup = {
      id: Date.now().toString(),  // 고유한 그룹 ID 자동 생성
      name: this.newGroupName,
      description: this.newGroupDescription,
      creator: user.username,  // 생성자 정보
      creatorName: `${user.firstName} ${user.lastName}`  // 생성자 이름 추가
    };

    this.http.post('http://localhost:4002/api/groups', newGroup).subscribe({
      next: () => {
        alert('Group created successfully');
        this.loadGroups();
        this.resetGroupForm();  // 입력 필드 초기화
        this.showCreateGroupForm = false;  // 그룹 생성 후 모달 창 닫기
      },
      error: (error) => {
        console.error('Error creating group:', error);
        alert(error.error ? error.error.error : 'An error occurred while creating the group.');
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
