import { Component } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavBarComponent } from '../nav-bar/nav-bar.component';

@Component({
  selector: 'app-notification',
  standalone: true,
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css'],
  imports: [CommonModule, HttpClientModule, NavBarComponent]
})
export class NotificationComponent {
  notifications: any[] = [];
  selectedNotification: any = null;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
    if (user && user.id) {
      this.http.get<any[]>(`http://localhost:4002/api/notifications/${user.id}`).subscribe({
        next: (data: any[]) => {
          this.notifications = data;
        },
        error: (error) => {
          if (error.status === 404) {
            console.warn('No notifications found.');
            this.notifications = [];
          } else {
            console.error('An unexpected error occurred:', error);
          }
        }
      });
    }
  }

  onNotificationClick(notification: any) {
    this.selectedNotification = notification;
  }

  onAccept() {
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
    
    if (user && user.id && this.selectedNotification) {
      const newRole = this.selectedNotification.message.match(/Super Admin|Group Admin|User/)[0]; // 알림 메시지에서 역할 추출
  
      if (newRole) {
        this.http.post<any>(`http://localhost:4002/api/accept-promotion/${user.id}`, { newRole }).subscribe({
          next: (response) => {
            alert(`Your new username is ${response.newUsername}. Please log in with this username.`);
            this.router.navigate(['/login']);
          },
          error: (error) => {
            console.error('Error accepting promotion:', error);
          }
        });
      } else {
        console.error('No valid role found in notification');
      }
    }
  }
  
  

  onClose() {
    this.selectedNotification = null;
  }
}
