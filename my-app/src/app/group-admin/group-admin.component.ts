import { Component } from '@angular/core';
import { NavBarComponent } from '../nav-bar/nav-bar.component';

@Component({
  selector: 'app-group-admin',
  standalone: true,
  templateUrl: './group-admin.component.html',
  styleUrls: ['./group-admin.component.css'],
  imports: [NavBarComponent]
})
export class GroupAdminComponent {
  title = 'Group Admin Dashboard';
}