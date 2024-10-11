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
  errorMessage: string = '';
  profileImage: File | null = null; // 프로필 이미지 필드 추가

  constructor(private authService: AuthService, private router: Router) {}

  goBack(): void {
    this.router.navigate(['/login']);  // 로그인 페이지로 돌아가기
  }

  onRegister(): void {
    let roles: string[] = [];
    
    // 역할 결정
    if (this.username.startsWith('s')) {
      roles = ['Super Admin'];
    } else if (this.username.startsWith('g')) {
      roles = ['Group Admin'];
    } else if (this.username.startsWith('u')) {
      roles = ['User'];
    } else {
      this.errorMessage = 'Username must start with "s" (Super Admin), "g" (Group Admin), or "u" (User).';
      return;
    }

    // FormData를 사용하여 파일과 데이터를 함께 전송
    const formData = new FormData();
    formData.append('username', this.username);
    formData.append('firstName', this.firstName);
    formData.append('lastName', this.lastName);
    formData.append('dob', this.dob);
    formData.append('email', this.email);
    formData.append('password', this.password);
    if (this.profileImage) {
      formData.append('profileImage', this.profileImage); // 이미지 추가
    }

    // 서비스 호출
    this.authService.register(formData).subscribe({
      next: (success: boolean) => {
        if (success) {
          alert('Registration successful!');
          this.router.navigate(['/login']);  // 로그인 페이지로 이동
        } else {
          this.errorMessage = 'Registration failed.';
        }
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = `Error: ${error.status} - ${error.error.message}`;
      }
    });
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.profileImage = target.files[0]; // 선택된 파일 저장
    }
  }
}
