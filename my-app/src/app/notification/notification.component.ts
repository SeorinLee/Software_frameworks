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
      // 알림 메시지에서 역할 변경 관련 메시지 구분
      if (this.selectedNotification.message.includes('role has been changed to')) {
        let newRole = this.selectedNotification.message.split('to ')[1].trim();
        
        // 역할 뒤에 "Please accept the promotion in your notifications."가 있으면 이를 제거
        if (newRole.includes('.')) {
          newRole = newRole.split('.')[0].trim();  // "."로 나눈 후 첫 번째 부분만 취함
        }
  
        // 디버깅: newRole 값을 콘솔에 출력
        console.log('Extracted newRole:', `"${newRole}"`);
  
        // newRole 값이 서버에서 허용하는 역할인지 확인
        if (['Super Admin', 'Group Admin', 'User'].includes(newRole)) {
          this.http.post<any>(`http://localhost:4002/api/accept-promotion/${user.id}`, { newRole }).subscribe({
            next: () => {
              alert('Promotion accepted.');
              this.router.navigate(['/user-dashboard']);
            },
            error: (error) => {
              console.error('Error accepting promotion:', error);
            }
          });
        } else {
          console.error('Invalid role specified:', newRole);
        }
      } else {
        console.error('Notification does not contain a role change message');
      }
    }
  }
  
  

  onClose() {
    this.selectedNotification = null;
  }
}
