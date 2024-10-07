import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router'; // RouterModule 추가
import { NavBarComponent } from '../nav-bar/nav-bar.component';
import { TopNavComponent } from '../top-nav/top-nav.component';
import { GroupListComponent } from '../group-list/group-list.component';

@Component({
  selector: 'app-group-admin',
  standalone: true,
  templateUrl: './group-admin.component.html',
  styleUrls: ['./group-admin.component.css'],
  imports: [CommonModule, FormsModule, RouterModule, NavBarComponent, TopNavComponent, GroupListComponent] // RouterModule 추가
})
export class GroupAdminComponent implements OnInit {
  title = 'Group Admin Dashboard';
  groups: any[] = [];
  searchTerm: string = '';
  filteredGroups: any[] = [];

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadGroups();
  }

  loadGroups() {
    const headers = { user: JSON.stringify(this.authService.getStoredUser()) };
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

  navigateToGroup(groupId: string) {
    this.router.navigate([`/groups/${groupId}`]);
  }
}
