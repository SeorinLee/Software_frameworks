import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NavBarComponent } from '../nav-bar/nav-bar.component';
import { CommonModule } from '@angular/common'; // Angular CommonModule 추가
import { FormsModule } from '@angular/forms'; // FormsModule 추가
import { AuthService } from '../auth.service';  // AuthService 임포트 추가

@Component({
  selector: 'app-group-detail',
  standalone: true,  // standalone 컴포넌트로 설정
  templateUrl: './group-detail.component.html',
  styleUrls: ['./group-detail.component.css'],
  imports: [CommonModule, NavBarComponent, FormsModule]
})
export class GroupDetailComponent implements OnInit {
  groupId: string = '';
  group: any;
  groupAdmins: any[] = [];  // 그룹 관리자 리스트
  groupMembers: any[] = [];  // 일반 유저 리스트
  groupChannels: any[] = [];
  showMembers: boolean = true;
  showChannels: boolean = false;
  newUserEmail: string = '';  // 초대할 유저 이메일

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private authService: AuthService  // AuthService 주입
  ) {}

  ngOnInit() {
    this.groupId = this.route.snapshot.paramMap.get('id')!;
    if (!this.groupId || this.groupId === '') {
      console.error('Invalid groupId');
      return;
    }
    this.loadGroupDetails();
    this.loadGroupMembers();
  }

  // 그룹 정보 로드
  loadGroupDetails() {
    this.http.get(`http://localhost:4002/api/groups/${this.groupId}`)
      .subscribe({
        next: (data) => {
          this.group = data;
          this.addGroupAdminToMembers();  // 그룹 생성자 추가
        },
        error: (error) => {
          console.error('Error loading group details:', error);
        }
      });
  }

  // 그룹 멤버 로드
  loadGroupMembers() {
    this.http.get<any[]>(`http://localhost:4002/api/groups/${this.groupId}/members`)
      .subscribe({
        next: (data: any[]) => {
          this.groupMembers = data.filter(member => member.status !== 'Group Admin'); // 일반 유저만 분리
          this.addGroupAdminToMembers();  // 그룹 생성자 추가
        },
        error: (error) => {
          console.error('Error loading group members:', error);
        }
      });
  }

  // 그룹 생성자를 관리자 리스트에 추가
  addGroupAdminToMembers() {
    if (this.group && this.group.creatorName) {
      const groupAdmin = {
        firstName: this.group.creatorName.split(' ')[0],
        lastName: this.group.creatorName.split(' ')[1],
        email: '',
        role: 'Group Admin'
      };

      const existingAdmin = this.groupAdmins.find(admin => admin.firstName === groupAdmin.firstName && admin.lastName === groupAdmin.lastName);
      if (!existingAdmin) {
        this.groupAdmins.unshift(groupAdmin);  // 관리자 리스트에 추가
      }
    }
  }

  // 사용자 초대 기능 구현
  inviteUser() {
    if (this.newUserEmail) {
      const inviteData = { email: this.newUserEmail, groupId: this.groupId };
      
      this.http.post(`http://localhost:4002/api/groups/${this.groupId}/invite`, inviteData)
        .subscribe({
          next: () => {
            alert('User invited successfully.');
            this.newUserEmail = '';  // 입력 필드 초기화
            this.loadGroupMembers();  // 업데이트된 멤버 목록 다시 로드
          },
          error: (error) => {
            console.error('Error inviting user:', error);
            alert('Error inviting user. Please try again.');
          }
        });
    } else {
      alert('Please enter a valid email.');
    }
  }

  // 탭 전환: 멤버
  showMembersTab() {
    this.showMembers = true;
    this.showChannels = false;
  }

  // 탭 전환: 채널
  showChannelsTab() {
    this.showMembers = false;
    this.showChannels = true;
    this.loadGroupChannels();
  }

  // 그룹 채널 로드
  loadGroupChannels() {
    const headers = { 'user': JSON.stringify(this.authService.getStoredUser()) };  // 사용자 정보를 헤더에 추가
    this.http.get<any[]>(`http://localhost:4002/api/groups/${this.groupId}/channels`, { headers })
      .subscribe({
        next: (data: any[]) => {
          this.groupChannels = data;
        },
        error: (error) => {
          console.error('Error loading group channels:', error);
        }
      });
  }
}
