import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.css'],
  imports: [CommonModule, RouterModule]
})
export class NavBarComponent {
  constructor(private authService: AuthService, private router: Router) {}

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  deleteAccount() {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (user && user.id) {
      if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        this.authService.deleteAccount(user.id).subscribe(() => {
          alert('Account deleted successfully!');
          this.authService.logout();
          this.router.navigate(['/login']);
        });
      }
    } else {
      alert('No user found. Please log in again.');
      this.router.navigate(['/login']);
    }
  }

  navigateToProfile() {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (user && user.id) {
      this.router.navigate(['/profile']);
    } else {
      alert('No user found. Please log in again.');
    }
  }

  isSuperAdmin(): boolean {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    return user && user.roles && user.roles.includes('Super Admin');
  }
}
