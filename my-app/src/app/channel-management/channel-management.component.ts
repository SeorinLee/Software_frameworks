import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { NavBarComponent } from '../nav-bar/nav-bar.component';
import { AuthService } from '../auth.service';  // AuthService 추가

@Component({
  selector: 'app-channel-management',
  standalone: true,
  templateUrl: './channel-management.component.html',
  styleUrls: ['./channel-management.component.css'],
  imports: [CommonModule, FormsModule, NavBarComponent]
})
export class ChannelManagementComponent {
  groups: any[] = [];
  selectedGroupId: string = '';
  channels: any[] = [];
  newChannelName: string = '';  // 채널 ID 자동 생성으로 변경
  newChannelDescription: string = '';
  showCreateChannelForm: boolean = false;  // Form visibility toggle

  constructor(private http: HttpClient, private authService: AuthService) {  // AuthService DI 추가
    this.loadGroups();
  }

  loadGroups() {
    const headers = { 'user': JSON.stringify(this.authService.getStoredUser()) };
    this.http.get<any[]>('http://localhost:4002/api/groups', { headers }).subscribe(data => {
      // Super Admin이면 모든 그룹, Group Admin이면 자신이 생성한 그룹만 표시
      this.groups = data.filter(group => {
        const user = this.authService.getStoredUser();
        return user.roles.includes('Super Admin') || group.creator === user.username;
      });
    });
  }

  loadChannels(groupId: string) {
    this.selectedGroupId = groupId;
    const headers = { 'user': JSON.stringify(this.authService.getStoredUser()) };
    this.http.get<any[]>(`http://localhost:4002/api/groups/${groupId}/channels`, { headers }).subscribe(data => {
      // Super Admin이면 모든 채널, Group Admin이면 자신이 생성한 채널만 표시
      const user = this.authService.getStoredUser();
      this.channels = data.filter(channel => 
        user.roles.includes('Super Admin') || channel.creator === user.username
      );
    });
  }

  createChannel() {
    if (!this.newChannelName || !this.newChannelDescription) {
      alert('All fields are required');
      return;
    }

    const newChannel = {
      name: this.newChannelName,
      description: this.newChannelDescription,
      creator: this.authService.getStoredUser().username // 생성자 정보 추가
    };

    this.http.post(`http://localhost:4002/api/groups/${this.selectedGroupId}/channels`, newChannel).subscribe({
      next: () => {
        alert('Channel created successfully');
        this.loadChannels(this.selectedGroupId);
        this.newChannelName = '';
        this.newChannelDescription = '';
        this.showCreateChannelForm = false;  // Hide the form after creation
      },
      error: (error) => {
        console.error('Error creating channel:', error);
        alert(error.error ? error.error.error : 'An error occurred while creating the channel.');
      }
    });
  }

  deleteChannel(channelId: string) {
    if (confirm('Are you sure you want to delete this channel?')) {
      const user = this.authService.getStoredUser(); // 사용자 정보 가져오기
      const headers = { 'user': JSON.stringify(user) }; // 사용자 정보를 헤더로 전달
  
      this.http.delete(`http://localhost:4002/api/groups/${this.selectedGroupId}/channels/${channelId}`, { headers }).subscribe(() => {
        alert('Channel deleted successfully');
        this.loadChannels(this.selectedGroupId);
      }, error => {
        alert(error.error ? error.error.error : 'An error occurred while deleting the channel.');
      });
    }
  }
}
