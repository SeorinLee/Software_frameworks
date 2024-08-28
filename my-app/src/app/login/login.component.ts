import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; // FormsModule 임포트
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service'; // AuthService 임포트

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [CommonModule, FormsModule]  // FormsModule 포함
})
export class LoginComponent {
  username: string = '';  // username 속성 정의
  password: string = '';  // password 속성 정의
  errorMessage: string = ''; // errorMessage 속성 정의

  constructor(private router: Router, private authService: AuthService) {} // AuthService 의존성 주입

  onLogin(event: Event): void {  // onLogin 메서드 정의
    event.preventDefault();

    // AuthService의 login 메서드 호출
    this.authService.login(this.username, this.password).subscribe((success: boolean) => {
      if (success) {
        localStorage.setItem('username', this.username);
        this.router.navigate(['/groups']);  // 로그인 성공 시 그룹 페이지로 이동
      } else {
        this.errorMessage = 'Invalid username or password'; // 오류 메시지 설정
      }
    });
  }
}
