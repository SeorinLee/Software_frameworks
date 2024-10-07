import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router'; // Router 임포트 추가
import { NavBarComponent } from '../nav-bar/nav-bar.component';
import { TopNavComponent } from '../top-nav/top-nav.component';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css'],
  imports: [CommonModule, NavBarComponent, TopNavComponent, RouterModule] // RouterModule 추가
})
export class UserDashboardComponent implements OnInit {
  title = 'User Dashboard';
  groups: any[] = [];
  filteredGroups: any[] = [];

  constructor(private http: HttpClient, private router: Router) {} // Router를 의존성 주입

  ngOnInit() {
    this.loadAllGroups(); // 모든 그룹 로드
  }

  // 모든 그룹을 불러오는 함수
  loadAllGroups() {
    this.http.get<any[]>('http://localhost:4002/api/groups').subscribe({
      next: (data: any) => {
        console.log('Loaded groups:', data);
        this.groups = data; // 모든 그룹을 그대로 가져옴
        this.filterGroups();
      },
      error: (error) => {
        console.error('Error loading all groups:', error);
      }
    });
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
    this.router.navigate([`/groups/${groupId}`]); // 라우터를 통해 그룹 상세 페이지로 이동
  }
}
