import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [CommonModule, FormsModule, HttpClientModule, RouterModule]
})
export class LoginComponent {
  email: string = '';  // 이메일로 로그인
  password: string = '';
  rememberMe: boolean = false;
  errorMessage: string = '';

  constructor(private router: Router, private authService: AuthService) {}

  onLogin(event: Event): void {
    event.preventDefault();

    this.authService.login(this.email, this.password).subscribe({
      next: (response: any) => {
        if (this.rememberMe) {
          localStorage.setItem('user', JSON.stringify(response));
        } else {
          sessionStorage.setItem('user', JSON.stringify(response));
        }

        const username = response.username;  // 서버에서 받은 username 사용
        let role = '';

        // username의 접두어를 바탕으로 role 설정
        if (username.startsWith('s')) {
          role = 'Super Admin';
        } else if (username.startsWith('g')) {
          role = 'Group Admin';
        } else if (username.startsWith('u')) {
          role = 'User';
        }

        response.roles = [role];  // 역할을 response에 추가

        // 역할에 따라 페이지 리다이렉트
        if (role === 'Super Admin') {
          this.router.navigate(['/super-admin']);
        } else if (role === 'Group Admin') {
          this.router.navigate(['/group-admin']);
        } else if (role === 'User') {
          this.router.navigate(['/user-dashboard']);
        } else {
          this.errorMessage = 'Unauthorized role';
          alert(this.errorMessage);
        }
      },
      error: () => {
        alert('Invalid email or password');
      }
    });
  }
}
