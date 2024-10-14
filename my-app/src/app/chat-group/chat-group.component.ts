import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';  
import { FormsModule } from '@angular/forms';  
import { NavBarComponent } from '../nav-bar/nav-bar.component';
import { AuthService } from '../auth.service';  

@Component({
  selector: 'app-chat-group',
  standalone: true,
  templateUrl: './chat-group.component.html',
  styleUrls: ['./chat-group.component.css'],
  imports: [CommonModule, FormsModule, NavBarComponent]  
})
export class ChatGroupComponent {
  groups: any[] = [];
  newGroupName: string = '';
  newGroupDescription: string = '';
  showCreateGroupForm: boolean = false;  

  constructor(private http: HttpClient, private authService: AuthService) {  
    this.loadGroups();
  }


  loadGroups() {
    const user = this.authService.getStoredUser(); // 로그인한 사용자 정보 가져오기
    const headers = { 'user': JSON.stringify(user) };

    // 모든 그룹을 가져온 후 필터링
    this.http.get<any[]>('http://localhost:4002/api/groups', { headers }).subscribe(data => {
      // 그룹 중 creator가 현재 로그인한 사용자와 일치하는 그룹만 필터링
      this.groups = data.filter(group => group.creator === user.username);
    });
  }

  createGroup() {
    if (!this.newGroupName || !this.newGroupDescription) {
      alert('All fields are required');
      return;
    }

    const user = this.authService.getStoredUser(); 
    const newGroup = {
      name: this.newGroupName,
      description: this.newGroupDescription,
      creator: user.username,
      creatorName: `${user.firstName} ${user.lastName}`  
    };

    this.http.post('http://localhost:4002/api/groups', newGroup).subscribe({
      next: () => {
        alert('Group created successfully');
        this.loadGroups();
        this.resetGroupForm(); 
        this.showCreateGroupForm = false; 
      },
      error: (error) => {
        console.error('Error creating group:', error);
        alert(error.error ? error.error.error : 'An error occurred while creating the group.');
      }
    });
  }

  deleteGroup(groupId: string) {
    if (confirm('Are you sure you want to delete this group?')) {
      const user = this.authService.getStoredUser(); 
      const headers = { 'user': JSON.stringify(user) }; 
  
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
