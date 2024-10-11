import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router'; // Router 추가
import { HttpClient } from '@angular/common/http';
import { NavBarComponent } from '../nav-bar/nav-bar.component';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms'; 

@Component({
  selector: 'app-group-detail',
  standalone: true,
  templateUrl: './group-detail.component.html',
  styleUrls: ['./group-detail.component.css'],
  imports: [CommonModule, NavBarComponent, FormsModule]
})
export class GroupDetailComponent implements OnInit {
  groupId: string = '';
  group: any;
  groupAdmins: any[] = [];
  groupMembers: any[] = [];
  groupChannels: any[] = [];
  showMembers: boolean = true;
  showChannels: boolean = false;
  selectedChannelId: string | null = null; // 선택된 채널 ID

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router  // Router 추가
  ) {}

  ngOnInit() {
    // 그룹 ID를 얻고 그룹 세부 정보를 로드합니다.
    this.groupId = this.route.snapshot.paramMap.get('id')!;
    this.loadGroupDetails(this.groupId);
    this.loadGroupMembers(this.groupId);
    this.loadGroupChannels();
  }

  // 그룹 세부 정보 로드
  loadGroupDetails(groupId: string) {
    this.http.get(`http://localhost:4002/api/groups/${groupId}`).subscribe({
      next: (data) => {
        this.group = data;
      },
      error: (error) => {
        console.error('Error loading group details:', error);
      }
    });
  }

  // 그룹 멤버 로드
  loadGroupMembers(groupId: string) {
    this.http.get<any[]>(`http://localhost:4002/api/groups/${groupId}/members`).subscribe({
      next: (data: any[]) => {
        this.groupMembers = data;
      },
      error: (error) => {
        console.error('Error loading group members:', error);
      }
    });
  }

  // 그룹 채널 로드
  loadGroupChannels() {
    this.http.get<any[]>(`http://localhost:4002/api/groups/${this.groupId}/channels`).subscribe({
      next: (data: any[]) => {
        this.groupChannels = data;
      },
      error: (error) => {
        console.error('Error loading group channels:', error);
      }
    });
  }

  // 멤버 탭 표시
  showMembersTab() {
    this.showMembers = true;
    this.showChannels = false;
  }

  // 채널 탭 표시
  showChannelsTab() {
    this.showMembers = false;
    this.showChannels = true;
  }

  // 그룹 채널 선택 시 호출되는 메소드
  navigateToChannel(channelId: string) {
    this.selectedChannelId = channelId; // 선택된 채널 ID 업데이트
    this.router.navigate([`/chat/${channelId}`]); // 채널 ID를 기반으로 채팅 컴포넌트로 이동
  }
}
