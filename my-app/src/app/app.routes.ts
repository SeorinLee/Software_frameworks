import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { SuperAdminComponent } from './super-admin/super-admin.component';
import { UserManagementComponent } from './user-management/user-management.component';
import { GroupManagementComponent } from './group-management/group-management.component';
import { GroupAdminComponent } from './group-admin/group-admin.component';
import { UserDashboardComponent } from './user-dashboard/user-dashboard.component';
import { ProfileComponent } from './profile/profile.component';
import { NotificationComponent } from './notification/notification.component'; // NotificationComponent 추가
import { AuthGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard], data: { role: ['super', 'group', 'user'] } },
  { path: 'notifications', component: NotificationComponent, canActivate: [AuthGuard], data: { role: ['super', 'group', 'user'] } }, // 알림 경로 추가
  { path: 'user-management', component: UserManagementComponent, canActivate: [AuthGuard], data: { role: 'super' } },
  { path: 'group-management', component: GroupManagementComponent, canActivate: [AuthGuard], data: { role: 'super' } },
  { path: 'super-admin', component: SuperAdminComponent, canActivate: [AuthGuard], data: { role: 'super' } },
  { path: 'group-admin', component: GroupAdminComponent, canActivate: [AuthGuard], data: { role: 'group' } },
  { path: 'user-dashboard', component: UserDashboardComponent, canActivate: [AuthGuard], data: { role: 'user' } },
];
