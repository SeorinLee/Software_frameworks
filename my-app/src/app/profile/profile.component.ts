import { Component, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, HttpClientModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent {
  user: any = { id: '', username: '', email: '', firstName: '', lastName: '' };

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      const storedUser = sessionStorage.getItem('user');
      if (!storedUser) {
        this.router.navigate(['/login']);
      } else {
        this.user = JSON.parse(storedUser);
        console.log(`Loaded user with ID: ${this.user.id}`);
      }
    }
  }

  onSaveProfile() {
    if (isPlatformBrowser(this.platformId)) {
      const updatedUser = { ...this.user };

      // 파일 업로드 제거, 단순 데이터 전송
      this.http.put(`http://localhost:4002/api/users/${this.user.id}`, updatedUser).subscribe({
        next: () => {
          alert('Profile updated successfully!');
          sessionStorage.setItem('user', JSON.stringify(updatedUser));
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to update profile:', error);
          this.handleError(error);
        }
      });
    }
  }

  onDeleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      if (isPlatformBrowser(this.platformId)) {
        this.http.delete(`http://localhost:4002/api/users/${this.user.id}`).subscribe({
          next: () => {
            alert('Account deleted successfully!');
            sessionStorage.clear();
            this.router.navigate(['/login']);
          },
          error: (error: HttpErrorResponse) => {
            console.error('Failed to delete account:', error);
            this.handleError(error);
          }
        });
      }
    }
  }

  onBack() {
    const userRole = this.user.username.startsWith('super')
      ? 'super-admin'
      : this.user.username.startsWith('group')
      ? 'group-admin'
      : 'user-dashboard';

    this.router.navigate([`/${userRole}`]);
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Client-side error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Server-side error: ${error.status} ${error.message}`;
    }
    alert(errorMessage);
  }
}
