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
import { NotificationComponent } from './notification/notification.component';
import { ChannelManagementComponent } from './channel-management/channel-management.component';
import { AuthGuard } from './auth.guard';
import { GroupDetailComponent } from './group-detail/group-detail.component';
import { ChatComponent } from './chat/chat.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard], data: { role: ['super admin', 'group admin', 'user'] } },
  { path: 'notifications', component: NotificationComponent, canActivate: [AuthGuard], data: { role: ['super admin', 'group admin', 'user'] } },
  { path: 'user-management', component: UserManagementComponent, canActivate: [AuthGuard], data: { role: 'super admin' } },
  { path: 'group-management', component: GroupManagementComponent, canActivate: [AuthGuard], data: { role: 'super admin' } },
  { path: 'chat-groups', component: ChatGroupComponent, canActivate: [AuthGuard], data: { role: ['super admin', 'group admin'] } },  
  { path: 'channel-management', component: ChannelManagementComponent, canActivate: [AuthGuard], data: { role: ['super admin', 'group admin'] } },

  { path: 'super-admin', component: SuperAdminComponent, canActivate: [AuthGuard], data: { role: 'super admin' } },
  { path: 'group-admin', component: GroupAdminComponent, canActivate: [AuthGuard], data: { role: 'group admin' } },

  { path: 'user-dashboard', component: UserDashboardComponent, canActivate: [AuthGuard], data: { role: 'user' } },


  { path: 'groups/:id', component: GroupDetailComponent, canActivate: [AuthGuard], data: { role: ['super admin', 'group admin', 'user'] } }, // 그룹 세부 페이지 추가
  { path: 'chat/:id', component: ChatComponent },  // 채팅 페이지 라우팅

  { path: '**', redirectTo: 'login' }
];
