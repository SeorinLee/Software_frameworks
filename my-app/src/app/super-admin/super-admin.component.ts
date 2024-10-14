import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavBarComponent } from '../nav-bar/nav-bar.component';

@Component({
  selector: 'app-super-admin',
  standalone: true,
  templateUrl: './super-admin.component.html',
  styleUrls: ['./super-admin.component.css'],
  imports: [CommonModule, FormsModule, NavBarComponent]
})
export class SuperAdminComponent implements OnInit {
  title = 'Super Admin Dashboard';
  groups: any[] = [];
  filteredGroups: any[] = [];
  showAllGroups: boolean = true;  // 탭 상태 관리
  showInterestGroups: boolean = false;
  selectedGroup: any = null;
  searchTerm: string = '';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadGroups();
  }

  // 그룹 목록 로드
  loadGroups() {
    const headers = { 'user': JSON.stringify(this.authService.getStoredUser()) };
    this.http.get<any[]>('http://localhost:4002/api/groups', { headers }).subscribe(data => {
      this.groups = data;
      this.filterGroups();
    });
  }

  // 그룹 필터링
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

  // All Groups 탭으로 전환
  showAllGroupsTab() {
    this.showAllGroups = true;
    this.showInterestGroups = false;
  }

  // Interest Groups 탭으로 전환
  showInterestGroupsTab() {
    this.showAllGroups = false;
    this.showInterestGroups = true;
  }

  // 그룹 클릭 시 그룹 세부 페이지로 이동하는 함수
  navigateToGroup(groupId: string) {
    this.router.navigate([`/groups/${groupId}`]);
  }
}
