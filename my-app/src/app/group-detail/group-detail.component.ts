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
  groupMembers: any[] = [];  // 일반 유저 리스트 (Accepted)
  pendingMembers: any[] = [];  // 대기 중인 유저 리스트 (Pending)
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
    this.loadGroupMembers();  // 모든 멤버 로드 (Accepted)
    this.loadGroupChannels(); // 그룹 채널 먼저 로드
    this.loadPendingMembers();  // 대기 중인 멤버 로드 (Pending)
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

  // 그룹 멤버 로드 (Accepted 상태)
  loadGroupMembers() {
    this.http.get<any[]>(`http://localhost:4002/api/groups/${this.groupId}/members/accepted`)
      .subscribe({
        next: (data: any[]) => {
          this.groupMembers = data;  // Accepted 상태의 멤버 불러오기
        },
        error: (error) => {
          console.error('Error loading accepted members:', error);
        }
      });
  }

  // 대기 중인 멤버 로드 (Pending 상태)
  loadPendingMembers() {
    this.http.get<any[]>(`http://localhost:4002/api/groups/${this.groupId}/members/pending`)
      .subscribe({
        next: (data: any[]) => {
          this.pendingMembers = data;  // Pending 상태의 멤버 불러오기
        },
        error: (error) => {
          console.error('Error loading pending members:', error);
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

// 멤버 승인
acceptMember(userId: string) {
  if (this.groupMembers.some(member => member._id === userId)) {
    alert('Member is already accepted.');
    return;
  }

  this.http.post(`http://localhost:4002/api/groups/${this.groupId}/accept/${userId}`, {})
    .subscribe({
      next: () => {
        alert('Member accepted successfully.');
        // Accepted 리스트에 멤버 추가 후 Pending 리스트에서 제거
        this.addMemberToAccepted(userId);
        this.updateInterestGroups(userId);  // 관심 그룹 목록 업데이트
      },
      error: (error) => {
        console.error('Error accepting member:', error);
      }
    });
}


// 관심 그룹 목록 업데이트 함수
// 관심 그룹 목록 업데이트 함수
updateInterestGroups(userId: string) {
  this.http.post(`http://localhost:4002/api/users/${userId}/updateInterestGroups`, { groupId: this.groupId })
    .subscribe({
      next: () => {
        console.log('Interest groups updated successfully.');
      },
      error: (error) => {
        console.error('Error updating interest groups:', error);
        // 404 에러 발생 시 적절한 처리
        if (error.status === 404) {
          console.error('API not found. Check the server route or URL.');
        }
      }
    });
}



// 승인된 멤버 리스트에 추가하는 함수
addMemberToAccepted(userId: string) {
  // 서버에서 해당 유저 정보 가져오기
  this.http.get<any>(`http://localhost:4002/api/users/${userId}`)
    .subscribe({
      next: (user) => {
        // 이미 Accepted에 유저가 있는지 확인 (중복 방지)
        if (this.groupMembers.some(member => member._id === userId)) {
          console.warn('User already accepted.');
          return;
        }
        // 유저 상태가 Accepted로 변경되면 Accepted 리스트에 추가
        this.groupMembers.push(user);
        // Pending 리스트에서 해당 멤버를 제거
        this.removePendingMember(userId);
      },
      error: (error) => {
        console.error('Error fetching user data:', error);
      }
    });
}

   // 대기 중인 멤버 리스트에서 멤버 제거
   removePendingMember(userId: string) {
    this.pendingMembers = this.pendingMembers.filter(member => member._id !== userId);
  }


// 멤버 삭제 함수
removeMember(userId: string) {
  if (confirm('Are you sure you want to remove this member from the group?')) {
    this.http.delete(`http://localhost:4002/api/groups/${this.groupId}/remove/${userId}`)
      .subscribe({
        next: () => {
          alert('Member removed successfully.');
          // Accepted 리스트에서 해당 멤버를 제거
          this.groupMembers = this.groupMembers.filter(member => member._id !== userId);
        },
        error: (error) => {
          console.error('Error removing member:', error);
        }
      });
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
