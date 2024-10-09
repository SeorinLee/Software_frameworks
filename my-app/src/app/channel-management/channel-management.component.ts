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
    this.http.get<any[]>(`http://localhost:4002/api/groups/${groupId}/channels`, { headers }).subscribe({
      next: (data) => {
        this.channels = data;  // 성공 시, 채널 데이터를 UI에 반영
      },
      error: (error) => {
        console.error('Error loading channels:', error);  // 오류 로그 확인
      }
    });
  }
  

  createChannel() {
    if (!this.newChannelName || !this.newChannelDescription) {
      alert('모든 필드를 입력해주세요.');
      return;
    }
  
    const newChannel = {
      id: Date.now().toString(),  // 타임스탬프를 이용하여 유니크한 ID 생성
      name: this.newChannelName,
      description: this.newChannelDescription,
      creator: this.authService.getStoredUser().username
    };
  
    // 서버에 새로운 채널을 생성 요청
    this.http.post(`http://localhost:4002/api/groups/${this.selectedGroupId}/channels`, newChannel).subscribe({
      next: () => {
        alert('채널이 성공적으로 생성되었습니다.');
        // 채널 생성 후 채널 목록을 다시 로드
        this.loadChannels(this.selectedGroupId); // 이 부분에서 새로 생성된 채널을 포함하여 목록을 갱신
        this.newChannelName = '';
        this.newChannelDescription = '';
        this.showCreateChannelForm = false;  // 생성 후 폼 숨기기
      },
      error: (error) => {
        console.error('채널 생성 중 오류:', error);
        alert(error.error ? error.error.error : '채널 생성 중 오류가 발생했습니다.');
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
