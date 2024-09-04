import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { SuperAdminComponent } from './super-admin/super-admin.component';
import { UserManagementComponent } from './user-management/user-management.component';
import { GroupManagementComponent } from './group-management/group-management.component';
import { GroupAdminComponent } from './group-admin/group-admin.component';
import { ChatGroupComponent } from './chat-group/chat-group.component';
import { UserDashboardComponent } from './user-dashboard/user-dashboard.component';
import { ProfileComponent } from './profile/profile.component';
import { NotificationComponent } from './notification/notification.component'; // NotificationComponent 추가
import { ChannelManagementComponent } from './channel-management/channel-management.component';
import { AuthGuard } from './auth.guard';
import { GroupDetailComponent } from './group-detail/group-detail.component'; // 그룹 세부 정보 컴포넌트

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' }, // 기본 경로를 로그인으로 리다이렉트
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // 인증된 사용자 전용 경로 (AuthGuard와 role 필터링 적용)
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard], data: { role: ['super', 'group', 'user'] } },
  { path: 'notifications', component: NotificationComponent, canActivate: [AuthGuard], data: { role: ['super', 'group', 'user'] } },
  { path: 'user-management', component: UserManagementComponent, canActivate: [AuthGuard], data: { role: 'super' } },
  { path: 'group-management', component: GroupManagementComponent, canActivate: [AuthGuard], data: { role: 'super' } },
  { path: 'chat-groups', component: ChatGroupComponent, canActivate: [AuthGuard], data: { role: ['super', 'group'] } },  
  { path: 'channel-management', component: ChannelManagementComponent, canActivate: [AuthGuard], data: { role: ['super', 'group'] } },

  // Super Admin 및 Group Admin 전용 경로
  { path: 'super-admin', component: SuperAdminComponent, canActivate: [AuthGuard], data: { role: 'super' } },
  { path: 'group-admin', component: GroupAdminComponent, canActivate: [AuthGuard], data: { role: 'group' } },

  // User 전용 대시보드 경로
  { path: 'user-dashboard', component: UserDashboardComponent, canActivate: [AuthGuard], data: { role: 'user' } },

  // 그룹 세부 정보 경로 (모든 사용자가 접근할 수 있음)
  { path: 'groups/:id', component: GroupDetailComponent, canActivate: [AuthGuard], data: { role: ['super', 'group', 'user'] } }, // 그룹 세부 페이지 추가

  // 잘못된 경로일 경우 기본 경로로 리다이렉트
  { path: '**', redirectTo: 'login' }
];
