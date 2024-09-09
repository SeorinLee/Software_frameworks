import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common'; // CommonModule 임포트
import { NavBarComponent } from '../nav-bar/nav-bar.component';
import { Router } from '@angular/router'; // Router 추가

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css'],
  imports: [CommonModule, NavBarComponent]  // CommonModule 및 NavBarComponent 추가
})
export class UserDashboardComponent implements OnInit {
  title = 'User Dashboard';  // title 속성 추가
  groups: any[] = [];  // 그룹 데이터를 저장할 배열
  filteredGroups: any[] = [];  // 검색에 따라 필터링된 그룹

  constructor(private http: HttpClient, private router: Router) {}  // Router 주입

  ngOnInit() {
    this.loadUserGroups();  // 컴포넌트가 로드될 때 그룹 정보를 로드하는 함수 호출
  }

// 사용자에게 할당된 그룹 목록을 불러오는 함수
loadUserGroups() {
  const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');

  if (user && user.id) {
    this.http.get<any[]>(`http://localhost:4002/api/users/${user.id}/groups`).subscribe({
      next: (data: any) => {
        // data가 배열인지 확인
        if (Array.isArray(data.groups)) {
          this.groups = data.groups.filter((group: any) => group.status === 'Accepted');
          this.filterGroups();  // 필터링한 그룹을 대시보드에 표시
        } else {
          console.error('Expected an array but got:', data.groups);
        }
      },
      error: (error) => {
        if (error.status === 404) {
          console.warn('No groups found for this user.');
          this.groups = [];  // 에러 발생 시 빈 그룹 목록 설정
        } else {
          console.error('Error loading user groups:', error);  // 그 외 에러 처리
        }
      }
    });
  }
}




  // 그룹을 필터링하는 함수
  filterGroups(searchTerm: string = '') {
    if (!searchTerm) {
      this.filteredGroups = this.groups;
    } else {
      const lowerSearchTerm = searchTerm.toLowerCase();
      this.filteredGroups = this.groups.filter(group =>
        group.name.toLowerCase().includes(lowerSearchTerm) || 
        group.description.toLowerCase().includes(lowerSearchTerm)
      );
    }
  }

  // 그룹 상세 페이지로 이동하는 함수
  navigateToGroup(groupId: string) {
    this.router.navigate([`/groups/${groupId}`]);  // 그룹 ID로 이동
  }
}
