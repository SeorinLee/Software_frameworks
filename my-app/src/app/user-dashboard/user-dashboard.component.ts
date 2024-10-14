import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common'; // CommonModule 임포트
import { NavBarComponent } from '../nav-bar/nav-bar.component';
import { Router } from '@angular/router'; // Router 추가
import { FormsModule } from '@angular/forms'; // FormsModule 추가

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css'],
  imports: [CommonModule,FormsModule, NavBarComponent]  // CommonModule 및 NavBarComponent 추가
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

  constructor(private http: HttpClient, private router: Router) {}  // Router 주입

  ngOnInit() {
    this.loadAllGroups();  // 모든 그룹 정보를 로드하는 함수 호출
    this.loadInterestGroups();  // 관심 그룹 정보를 로드하는 함수 호출
  }

  // 모든 그룹을 로드하는 함수
  loadAllGroups() {
    this.http.get<any[]>('http://localhost:4002/api/groups').subscribe({
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
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
    
    if (user && user.id) {
      // 현재 사용자의 관심 그룹 정보를 서버에서 가져옴
      this.http.get<any[]>(`http://localhost:4002/api/users/${user.id}/groups`).subscribe({
        next: (data: any[]) => {
          // 그룹 데이터 중에서 'Accepted' 상태인 그룹만 필터링
          this.interestGroups = data.filter(group => group.status === 'Accepted');
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
  }

  // 탭 전환: All Groups
  showAllGroupsTab() {
    this.showAllGroups = true;
    this.showInterestGroups = false;
  }

  // 탭 전환: Interest Groups
  showInterestGroupsTab() {
    this.showAllGroups = false;
    this.showInterestGroups = true;
  }

  // 그룹 상세 페이지로 이동하는 함수
  navigateToGroup(groupId: string) {
    this.router.navigate([`/groups/${groupId}`]);  // 그룹 ID로 이동
  }
}
