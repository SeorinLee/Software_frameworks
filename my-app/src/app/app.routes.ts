import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { SuperAdminComponent } from './super-admin/super-admin.component';
import { GroupAdminComponent } from './group-admin/group-admin.component';
import { UserDashboardComponent } from './user-dashboard/user-dashboard.component';
import { ProfileComponent } from './profile/profile.component'; // 프로필 컴포넌트 추가
import { AuthGuard } from './auth.guard';  // AuthGuard 추가

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent }, // 회원가입 경로

  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard], data: { role: ['super', 'group', 'user'] } },  // 통합된 프로필 경로
  { path: 'super-admin', component: SuperAdminComponent, canActivate: [AuthGuard], data: { role: 'super' } },
  { path: 'group-admin', component: GroupAdminComponent, canActivate: [AuthGuard], data: { role: 'group' } },
  { path: 'user-dashboard', component: UserDashboardComponent, canActivate: [AuthGuard], data: { role: 'user' } },
];

