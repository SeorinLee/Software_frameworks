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
  filteredGroups: any[] = [];
  searchTerm: string = '';  // 검색어 추가
  showAllGroups: boolean = true;  // 기본적으로 All Groups 탭을 보여줌
  showInterestGroups: boolean = false;  // Interest Groups 탭은 기본적으로 숨김

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router // Router 추가
  ) {
    this.loadGroups();
  }

  // 모든 그룹을 로드하는 함수
  loadGroups() {
    const headers = { 'user': JSON.stringify(this.authService.getStoredUser()) };
    this.http.get<any[]>('http://localhost:4002/api/groups', { headers }).subscribe(data => {
      this.groups = data;
      this.filteredGroups = data;  // 초기 필터링된 그룹
    });
  }

  // 검색 기능 구현
  filterGroups() {
    if (!this.searchTerm) {
      this.filteredGroups = this.groups;
    } else {
      const lowerSearchTerm = this.searchTerm.toLowerCase();
      this.filteredGroups = this.groups.filter(group =>
        group.name.toLowerCase().includes(lowerSearchTerm) || 
        group.description.toLowerCase().includes(lowerSearchTerm) ||
        (group.creatorName && group.creatorName.toLowerCase().includes(lowerSearchTerm))
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

  // 그룹 클릭 시 그룹 세부 페이지로 이동하는 함수
  navigateToGroup(groupId: string) {
    this.router.navigate([`/groups/${groupId}`]);  // 그룹 상세 페이지로 이동
  }
}
