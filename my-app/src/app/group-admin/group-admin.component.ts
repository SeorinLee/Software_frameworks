import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';  // Router 임포트
import { CommonModule } from '@angular/common';  // CommonModule 추가
import { FormsModule } from '@angular/forms'; // FormsModule 추가
import { NavBarComponent } from '../nav-bar/nav-bar.component';

@Component({
  selector: 'app-group-admin',
  standalone: true,
  templateUrl: './group-admin.component.html',
  styleUrls: ['./group-admin.component.css'],
  imports: [CommonModule, FormsModule, NavBarComponent]  // CommonModule 및 FormsModule 추가
})
export class GroupAdminComponent {
  title = 'Group Admin Dashboard';
  groups: any[] = [];
  myGroups: any[] = [];
  otherGroups: any[] = [];
  filteredGroups: any[] = [];
  searchTerm: string = '';  // 검색어 추가
  showAllGroups: boolean = true;  // 기본적으로 All Groups 탭을 보여줌
  showMyGroup: boolean = false;
  showInterestGroups: boolean = false;  // Interest Groups 탭은 기본적으로 숨김

  constructor(
    private http: HttpClient,
    public authService: AuthService, // public으로 변경
    private router: Router // Router 추가
  ) {
    this.loadGroups();
  }

  // 그룹 목록을 로드하는 함수
  loadGroups() {
    const user = this.authService.getStoredUser(); // 현재 로그인한 사용자 정보
    const headers = { 'user': JSON.stringify(user) };

    this.http.get<any[]>('http://localhost:4002/api/allgroups', { headers }).subscribe(data => {
      this.groups = data;
      
      // 본인이 생성한 그룹과 다른 관리자가 생성한 그룹을 구분
      this.myGroups = data.filter(group => group.creator === user.username);
      this.otherGroups = data.filter(group => group.creator !== user.username);

      // 기본적으로 All Groups를 필터링
      this.filteredGroups = this.otherGroups;
    });
  }

  // 검색 기능 구현
  filterGroups() {
    const lowerSearchTerm = this.searchTerm.toLowerCase();

    if (this.showAllGroups) {
      this.filteredGroups = this.otherGroups.filter(group =>
        group.name.toLowerCase().includes(lowerSearchTerm) || 
        group.description.toLowerCase().includes(lowerSearchTerm) ||
        (group.creatorName && group.creatorName.toLowerCase().includes(lowerSearchTerm))
      );
    } else if (this.showMyGroup) {
      this.filteredGroups = this.myGroups.filter(group =>
        group.name.toLowerCase().includes(lowerSearchTerm) || 
        group.description.toLowerCase().includes(lowerSearchTerm) ||
        (group.creatorName && group.creatorName.toLowerCase().includes(lowerSearchTerm))
      );
    }
  }

  // 탭 전환: All Groups
  showAllGroupsTab() {
    this.showAllGroups = true;
    this.showMyGroup = false;
    this.showInterestGroups = false;
    this.filteredGroups = this.otherGroups;
  }

  // 탭 전환: My Groups
  showMyGroupTab() {
    this.showAllGroups = false;
    this.showMyGroup = true;
    this.showInterestGroups = false;
    this.filteredGroups = this.myGroups;
  }

  // 탭 전환: Interest Groups
  showInterestGroupsTab() {
    this.showAllGroups = false;
    this.showMyGroup = false;
    this.showInterestGroups = true;
  }

  // 그룹 참여 요청 함수
  joinGroup(groupId: string) {
    const user = this.authService.getStoredUser(); // 사용자 정보 가져오기
    const headers = { 'user': JSON.stringify(user) };
  
    this.http.post(`http://localhost:4002/api/groups/${groupId}/join`, {}, { headers })
      .subscribe({
        next: () => {
          alert('Successfully joined the group.');
        },
        error: (error) => {
          console.error('Error sending join request:', error);
          alert(error.error ? error.error.error : 'An error occurred while sending the join request.');
        }
      });
  }
  

  // 그룹 클릭 시 그룹 세부 페이지로 이동하는 함수
  navigateToGroup(groupId: string) {
    this.router.navigate([`/groups/${groupId}`]);  // 그룹 상세 페이지로 이동
  }
}
