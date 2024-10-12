import { Component, Inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, HttpClientModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  user: any = { id: '', username: '', email: '', firstName: '', lastName: '', dob: '', imageUrl: '' };
  profileImage: File | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const storedUser = this.authService.getStoredUser(); // 유저 정보를 가져오는 메소드
      console.log('Stored User:', storedUser);
      if (!storedUser) {
        console.warn('No user found in session or local storage. Redirecting to login.');
        this.router.navigate(['/login']);
      } else {
        this.user = storedUser; // 세션에서 가져온 유저 정보 사용
        console.log(`Loaded user profile:`, this.user);
      }
    }
  }

  onProfileImageChange(event: any) {
    this.profileImage = event.target.files[0]; // 새 이미지 파일 선택
  }

  onSaveProfile() {
    if (isPlatformBrowser(this.platformId)) {
      const formData = new FormData();
      formData.append('username', this.user.username);
      formData.append('email', this.user.email);
      formData.append('firstName', this.user.firstName);
      formData.append('lastName', this.user.lastName);
      formData.append('dob', this.user.dob);
      
      if (this.profileImage) {
        formData.append('profileImage', this.profileImage);
      }
      
      this.http.put(`http://localhost:4002/api/users/${this.user._id}`, formData).subscribe({
        next: (updatedUser) => {
          alert('Profile updated successfully!');

          const newProfileImageUrl = this.profileImage ? `http://localhost:4002/uploads/${this.profileImage.name}` : this.user.imageUrl;
          
          // 사용자 정보를 세션에 업데이트
          this.authService.updateUserProfile({
            ...this.user, // 기존 정보
            imageUrl: this.profileImage ? `http://localhost:4002/uploads/${this.profileImage.name}` : this.user.imageUrl
          });
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
        this.http.delete(`http://localhost:4002/api/users/delete/${this.user._id}`).subscribe({
          next: () => {
            alert('Account deleted successfully!');
            sessionStorage.clear();
            this.router.navigate(['/login']);
          },
          error: (error: HttpErrorResponse) => {
            console.error('Failed to delete account:', error);
            alert('Failed to delete account. Please try again later.');
          }
        });
      }
    }
  }

  onBack() {
    const role = this.authService.getUserRole();
    if (role === 'Super Admin') {
      this.router.navigate(['/super-admin']);
    } else if (role === 'Group Admin') {
      this.router.navigate(['/group-admin']);
    } else {
      this.router.navigate(['/user-dashboard']);
    }
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client-side error: ${error.error.message}`;
    } else {
      errorMessage = `Server-side error: ${error.status} ${error.message}`;
    }
    alert(errorMessage);
  }
}
