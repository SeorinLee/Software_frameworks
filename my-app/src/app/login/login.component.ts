import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router'; // RouterModule 추가

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [CommonModule, FormsModule, HttpClientModule, RouterModule] // RouterModule을 imports에 추가
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  rememberMe: boolean = false;  // Remember Me 필드 추가
  errorMessage: string = '';

  constructor(private router: Router, private authService: AuthService) {}

  onLogin(event: Event): void { 
    event.preventDefault();

    this.authService.login(this.username, this.password).subscribe({
      next: (response: any) => {
        if (this.rememberMe) {
          localStorage.setItem('user', JSON.stringify(response));  // 로컬 스토리지에 저장
        } else {
          sessionStorage.setItem('user', JSON.stringify(response)); // 세션 스토리지에 저장
        }

        console.log('Logged in user:', sessionStorage.getItem('user'));
    
        // 역할에 따라 적절한 페이지로 리디렉션
        if (response.username.startsWith('super')) {
          this.router.navigate(['/super-admin']);
        } else if (response.username.startsWith('group')) {
          this.router.navigate(['/group-admin']);
        } else if (response.username.startsWith('user')) {
          this.router.navigate(['/user-dashboard']);
        } else {
          this.errorMessage = 'Unauthorized role';
          alert(this.errorMessage);
        }
      },
      error: () => {
        alert('Invalid username or password');
      }
    });
    
  }
}
