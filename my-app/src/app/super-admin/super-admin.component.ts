import { Component, OnChanges } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';  // Router 추가
import { CommonModule } from '@angular/common';  // CommonModule 추가
import { FormsModule } from '@angular/forms'; // FormsModule 추가
import { NavBarComponent } from '../nav-bar/nav-bar.component';

@Component({
  selector: 'app-super-admin',
  standalone: true,
  templateUrl: './super-admin.component.html',
  styleUrls: ['./super-admin.component.css'],
  imports: [CommonModule, FormsModule, NavBarComponent]  // CommonModule 추가
})
export class SuperAdminComponent implements OnChanges {
  title = 'Super Admin Dashboard';
  groups: any[] = [];
  searchTerm: string = '';  // 검색어 추가
  filteredGroups: any[] = [];  // 필터링된 그룹 저장

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router // Router 추가
  ) {
    this.loadGroups();
  }

  loadGroups() {
    const headers = { 'user': JSON.stringify(this.authService.getStoredUser()) };
    this.http.get<any[]>('http://localhost:4002/api/groups', { headers }).subscribe(data => {
      this.groups = data;
      this.filterGroups();  // 그룹 로드 후 필터링
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
        (group.creatorName && group.creatorName.toLowerCase().includes(lowerSearchTerm)) // creatorName이 존재하는지 확인
      );
    }
  }

  // 그룹 클릭 시 그룹 세부 페이지로 이동하는 함수
  navigateToGroup(groupId: string) {
    this.router.navigate([`/groups/${groupId}`]);  // 그룹 상세 페이지로 이동
  }

  ngOnChanges() {
    this.filterGroups();  // 검색어 변경 시 필터링 수행
  }
}
