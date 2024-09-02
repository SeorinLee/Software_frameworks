import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { HttpClientModule } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  standalone: true,
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  imports: [CommonModule, FormsModule, HttpClientModule]
})
export class RegisterComponent {
  username: string = '';
  firstName: string = '';
  lastName: string = '';
  dob: string = '';
  email: string = '';
  password: string = '';
  groups: string = '';  // groups 필드 추가
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  goBack(): void {
    this.router.navigate(['/login']);  // Login 페이지로 이동
  }

  onRegister(): void {
    // username을 기반으로 role 자동 설정
    let roles: string[] = [];
    if (this.username.startsWith('super')) {
      roles = ['Super Admin'];
    } else if (this.username.startsWith('group')) {
      roles = ['Group Admin'];
    } else if (this.username.startsWith('user')) {
      roles = ['User'];
    } else {
      this.errorMessage = 'Invalid username format. It must start with "super", "group", or "user".';
      return;
    }

    const newUser = {
      username: this.username,
      firstName: this.firstName,
      lastName: this.lastName,
      dob: this.dob,
      email: this.email,
      password: this.password,
      roles: roles,  // 자동 설정된 roles 사용
      groups: this.groups.split(',')  // groups 필드 처리
    };

    console.log('Registering user:', newUser);

    this.authService.register(newUser).subscribe({
      next: (success: boolean) => {
        if (success) {
          alert('Registration successful!');
          this.router.navigate(['/login']);
        } else {
          this.errorMessage = 'Registration failed.';
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error('Registration error:', error);
    
        // 더 구체적인 오류 메시지 처리
        if (error.status === 400) {
          if (error.error && error.error.error) {
            this.errorMessage = error.error.error;
          } else {
            this.errorMessage = 'Bad Request: Registration failed.';
          }
        } else {
          this.errorMessage = `Error ${error.status}: ${error.statusText}`;
        }
      }
    });
  }
}
