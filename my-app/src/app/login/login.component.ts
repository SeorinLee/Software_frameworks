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
  username: string = '';
  password: string = '';
  rememberMe: boolean = false;
  errorMessage: string = '';

  constructor(private router: Router, private authService: AuthService) {}

  onLogin(event: Event): void {
    event.preventDefault();

    this.authService.login(this.username, this.password).subscribe({
      next: (response: any) => {
        if (this.rememberMe) {
          localStorage.setItem('user', JSON.stringify(response));
        } else {
          sessionStorage.setItem('user', JSON.stringify(response));
        }

        const role = response.roles?.[0];  // Get the first role

        console.log('Logged in with role:', role);

        // Redirect based on role
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
        alert('Invalid username or password');
      }
    });
  }
}
