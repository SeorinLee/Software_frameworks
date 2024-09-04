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

  constructor(private authService: AuthService, private router: Router) {}

  goBack(): void {
    this.router.navigate(['/login']);  // Navigate back to the login page
  }

  onRegister(): void {
    let roles: string[] = [];
    
    // Determine role based on username prefix
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

    // Prepare the new user object
    const newUser = {
      username: this.username,
      firstName: this.firstName,
      lastName: this.lastName,
      dob: this.dob,
      email: this.email,
      password: this.password,
      roles: roles
    };

    // Call the registration service
    this.authService.register(newUser).subscribe({
      next: (success: boolean) => {
        if (success) {
          alert('Registration successful!');
          this.router.navigate(['/login']);  // Redirect to login
        } else {
          this.errorMessage = 'Registration failed.';
        }
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = `Error: ${error.status} - ${error.error.message}`;
      }
    });
  }
}
