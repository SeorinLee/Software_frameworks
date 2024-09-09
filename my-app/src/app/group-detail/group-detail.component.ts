import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NavBarComponent } from '../nav-bar/nav-bar.component';
import { CommonModule } from '@angular/common'; // Angular CommonModule 추가
import { FormsModule } from '@angular/forms'; // FormsModule 추가

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
  newUserEmail: string = '';
  searchName: string = ''; // Input for user search
  searchedUsers: any[] = []; // Array to store search results

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit() {
    this.groupId = this.route.snapshot.paramMap.get('id')!;
    console.log("Group ID:", this.groupId);  // 디버그 용도로 콘솔에 groupId 출력
    this.loadGroupDetails(this.groupId);
    this.loadGroupMembers(this.groupId);
  }

  // 그룹 세부 정보 로드
  loadGroupDetails(groupId: string) {
    this.http.get(`http://localhost:4002/api/groups/${groupId}`).subscribe({
      next: (data) => {
        this.group = data;
        this.addGroupAdminToMembers();
      },
      error: (error) => {
        if (error.status === 404) {
          console.error('그룹을 찾을 수 없습니다.');
          alert('해당 그룹을 찾을 수 없습니다.');
        } else {
          console.error('그룹 세부 정보를 로드하는 중 오류가 발생했습니다:', error);
        }
      }
    });
  }

  // 그룹 멤버 로드
  loadGroupMembers(groupId: string) {
    this.http.get<any[]>(`http://localhost:4002/api/groups/${groupId}/members`)
      .subscribe({
        next: (data: any[]) => {
          this.groupMembers = data;
        },
        error: (error) => {
          console.error('Error loading group members:', error);
        }
      });
  }

  // 유저 검색 기능 (이름 또는 이메일)
  searchUser() {
    // 검색한 값이 이메일인지, 이름인지 확인
    if (this.searchName.includes('@')) {
      // 이메일로 검색
      this.http.get<any[]>(`http://localhost:4002/api/users?email=${this.searchName}`)
        .subscribe({
          next: (data) => {
            this.searchedUsers = data.filter(user => user.email.includes(this.searchName));
          },
          error: (error) => {
            console.error('Error searching users by email:', error);
          }
        });
    } else {
      // 이름으로 검색
      this.http.get<any[]>(`http://localhost:4002/api/users?name=${this.searchName}`)
        .subscribe({
          next: (data) => {
            // 사용자의 이름에 검색한 부분이 포함된 유저들만 필터링
            this.searchedUsers = data.filter(user =>
              user.firstName.toLowerCase().includes(this.searchName.toLowerCase()) ||
              user.lastName.toLowerCase().includes(this.searchName.toLowerCase())
            );
          },
          error: (error) => {
            console.error('Error searching users by name:', error);
          }
        });
    }
  }

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
        this.groupAdmins.unshift(groupAdmin);
      }
    }
  }

  inviteUser(username: string) {
    const inviteData = { username: username, groupId: this.groupId };
      
    this.http.post(`http://localhost:4002/api/groups/${this.groupId}/invite`, inviteData)
      .subscribe({
        next: () => {
          alert('User invited successfully.');
          this.loadGroupMembers(this.groupId);  // 업데이트된 멤버 목록 다시 로드
        },
        error: (error) => {
          if (error.error && error.error.error === 'User is already in the group.') {
            alert('This user is already in the group.');
          } else {
            console.error('Error inviting user:', error);
            alert('Error inviting user. Please try again.');
          }
        }
      });
  }

  showMembersTab() {
    this.showMembers = true;
    this.showChannels = false;
  }

  showChannelsTab() {
    this.showMembers = false;
    this.showChannels = true;
    this.loadGroupChannels();
  }

  loadGroupChannels() {
    this.http.get<any[]>(`http://localhost:4002/api/groups/${this.groupId}/channels`)
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
