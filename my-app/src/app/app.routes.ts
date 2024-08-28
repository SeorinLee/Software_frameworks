import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },  // 기본 경로로 로그인 페이지 설정
  // 다른 경로들을 여기 추가할 수 있습니다.
];
