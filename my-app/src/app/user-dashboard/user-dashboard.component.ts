import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common'; // CommonModule 임포트
import { FormsModule } from '@angular/forms'; // FormsModule 추가
import { NavBarComponent } from '../nav-bar/nav-bar.component';
import { Router } from '@angular/router'; // Router 추가
import { AuthService } from '../auth.service'; // AuthService 추가

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css'],
  imports: [CommonModule, FormsModule, NavBarComponent]  // FormsModule 추가
})
export class UserDashboardComponent implements OnInit {
  title = 'User Dashboard';  // title 속성 추가
  allGroups: any[] = [];  // 모든 그룹 데이터를 저장할 배열
  interestGroups: any[] = [];  // 사용자 관심 그룹
  filteredGroups: any[] = [];  // 검색에 따라 필터링된 그룹
  filteredInterestGroups: any[] = [];  // 검색에 따라 필터링된 관심 그룹
  searchTerm: string = '';  // 검색어 추가
  showAllGroups: boolean = true;  // 기본적으로 All Groups를 표시
  showInterestGroups: boolean = false;  // Interest Groups를 숨김
  user: any; // 현재 사용자 정보 저장

  constructor(
    private http: HttpClient, 
    private router: Router, 
    private authService: AuthService  // AuthService 주입
  ) {}

  ngOnInit() {
    this.user = this.authService.getStoredUser(); // 사용자 정보 불러오기
    this.loadAllGroups();  // 모든 그룹 정보를 로드하는 함수 호출
    this.loadInterestGroups();  // 관심 그룹 정보를 로드하는 함수 호출
  }

  // 모든 그룹을 로드하는 함수
  loadAllGroups() {
    this.http.get<any[]>('http://localhost:4002/api/allgroups').subscribe({
      next: (data) => {
        this.allGroups = data;  // 모든 그룹 데이터를 저장
        this.filterGroups();  // 필터링된 그룹 데이터 갱신
      },
      error: (error) => {
        console.error('Error loading all groups:', error);
      }
    });
  }

// 사용자에게 할당된 관심 그룹 목록을 불러오는 함수
loadInterestGroups() {
  if (this.user && this.user.id) {
    this.http.get<any[]>(`http://localhost:4002/api/users/${this.user.id}/groups`).subscribe({
      next: (data: any[]) => {
        console.log('Loaded user groups:', data);  // 로그 추가

        // 그룹 데이터 중에서 'Accepted' 상태인 그룹만 필터링
        this.interestGroups = data.filter(group => group.status === 'Accepted');
        console.log('Filtered accepted groups:', this.interestGroups);  // 로그 추가
        this.filterInterestGroups();  // 필터링된 관심 그룹 데이터 갱신
      },
      error: (error) => {
        console.error('Error loading interest groups:', error);
      }
    });
  }
}



  // 그룹을 필터링하는 함수
  filterGroups(searchTerm: string = '') {
    if (!searchTerm) {
      this.filteredGroups = this.allGroups;
    } else {
      const lowerSearchTerm = searchTerm.toLowerCase();
      this.filteredGroups = this.allGroups.filter(group =>
        group.name.toLowerCase().includes(lowerSearchTerm) || 
        group.description.toLowerCase().includes(lowerSearchTerm)
      );
    }
  }

  // 관심 그룹을 필터링하는 함수
  filterInterestGroups(searchTerm: string = '') {
    if (!searchTerm) {
      this.filteredInterestGroups = this.interestGroups;
    } else {
      const lowerSearchTerm = searchTerm.toLowerCase();
      this.filteredInterestGroups = this.interestGroups.filter(group =>
        group.name.toLowerCase().includes(lowerSearchTerm) || 
        group.description.toLowerCase().includes(lowerSearchTerm)
      );
    }
    console.log('Filtered interest groups displayed on UI:', this.filteredInterestGroups);  // UI에 표시되는 데이터를 로그로 확인
  }

  // 특정 그룹에 참여 여부를 확인하는 함수
  isGroupJoined(groupId: string): boolean {
    return this.interestGroups.some(group => group.groupId === groupId);
  }

// 그룹에 참여하는 함수 (Pending 상태로 추가)
joinGroup(groupId: string) {
  const user = this.authService.getStoredUser(); // 사용자 정보 가져오기
  const headers = { 'user': JSON.stringify(user) };

  this.http.post(`http://localhost:4002/api/groups/${groupId}/join`, {}, { headers })
    .subscribe({
      next: () => {
        alert('Successfully joined the group. Waiting for admin approval.');
        // 그룹을 Interest Groups로 이동하고 All Groups에서 제거
        this.loadAllGroups(); // All Groups 목록 새로고침
        this.loadInterestGroups(); // Interest Groups 목록 새로고침
      },
      error: (error) => {
        console.error('Error sending join request:', error);
        alert(error.error ? error.error.error : 'An error occurred while sending the join request.');
      }
    });
}
  

  // 그룹 클릭 시 그룹 디테일 페이지로 이동, 참여하지 않으면 알림 표시
  navigateToGroup(groupId: string) {
    const group = this.interestGroups.find(g => g.groupId === groupId);
    if (group && group.status === 'Accepted') {
      this.router.navigate([`/groups/${groupId}`]);
    } else {
      alert('You must join this group before accessing details.');
    }
  }

// 탭 전환: All Groups
showAllGroupsTab() {
  this.showAllGroups = true;
  this.showInterestGroups = false;
  this.loadAllGroups(); // All Groups 목록 새로고침
}

// 탭 전환: Interest Groups
showInterestGroupsTab() {
  this.showAllGroups = false;
  this.showInterestGroups = true;
  this.loadInterestGroups(); // Interest Groups 목록 새로고침
}
}
