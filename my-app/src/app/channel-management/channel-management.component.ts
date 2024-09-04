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
  newChannelId: string = '';
  newChannelName: string = '';
  newChannelDescription: string = '';
  showCreateChannelForm: boolean = false;  // Form visibility toggle

  constructor(private http: HttpClient, private authService: AuthService) {  // AuthService DI 추가
    this.loadGroups();
  }

  loadGroups() {
    const headers = { 'user': JSON.stringify(this.authService.getStoredUser()) };
    this.http.get<any[]>('http://localhost:4002/api/groups', { headers }).subscribe(data => {
      this.groups = data;
    });
  }

  loadChannels(groupId: string) {
    this.selectedGroupId = groupId;
    const headers = { 'user': JSON.stringify(this.authService.getStoredUser()) };
    this.http.get<any[]>(`http://localhost:4002/api/groups/${groupId}/channels`, { headers }).subscribe(data => {
      this.channels = data;
    });
  }

  createChannel() {
    if (!this.newChannelId || !this.newChannelName || !this.newChannelDescription) {
      alert('All fields are required');
      return;
    }

    const newChannel = {
      id: this.newChannelId,
      name: this.newChannelName,
      description: this.newChannelDescription,
      creator: this.authService.getStoredUser().username // 생성자 정보 추가
    };

    this.http.post(`http://localhost:4002/api/groups/${this.selectedGroupId}/channels`, newChannel).subscribe({
      next: () => {
        alert('Channel created successfully');
        this.loadChannels(this.selectedGroupId);
        this.newChannelId = '';
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
      this.http.delete(`http://localhost:4002/api/groups/${this.selectedGroupId}/channels/${channelId}`, { body: { user } }).subscribe(() => {
        alert('Channel deleted successfully');
        this.loadChannels(this.selectedGroupId);
      }, error => {
        alert(error.error ? error.error.error : 'An error occurred while deleting the channel.');
      });
    }
  }
}
