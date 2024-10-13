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
  searchTerm: string = '';
  filteredGroups: any[] = [];
  currentPage: string = 'dashboard';  // 현재 페이지 상태

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadGroups();
  }

  loadGroups() {
    const headers = { 'user': JSON.stringify(this.authService.getStoredUser()) };
    this.http.get<any[]>('http://localhost:4002/api/groups', { headers }).subscribe(data => {
      this.groups = data;
      this.filterGroups();
    });
  }

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

  // 그룹 클릭 시 그룹 세부 페이지로 이동하는 함수
  navigateToGroup(groupId: string) {
    this.router.navigate([`/groups/${groupId}`]);
  }

  // Super Admin Dashboard로 이동
  navigateToDashboard() {
    this.currentPage = 'dashboard';
    this.router.navigate(['/super-admin']);
  }

  // 그룹 멤버 관리 페이지로 이동
  navigateToAllGroups() {
    this.currentPage = 'all-groups';
    this.router.navigate(['/all-groups']);
  }

  // 채널 멤버 관리 페이지로 이동
  navigateToInterestGroups() {
    this.currentPage = 'interest-groups';
    this.router.navigate(['/interest-groups']);
  }
}
