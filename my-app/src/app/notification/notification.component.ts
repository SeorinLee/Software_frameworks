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
    if (user && user._id) {  // 수정: user._id 사용
      this.http.get<any[]>(`http://localhost:4002/api/notifications/${user._id}`).subscribe({
        next: (data: any[]) => {
          this.notifications = data;
          console.log('Loaded notifications:', this.notifications);  // 디버깅용 로그
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
    
    if (user && user._id && this.selectedNotification) {  // 수정: user._id 사용
      // 알림 메시지에서 역할 변경 관련 메시지 구분
      if (this.selectedNotification.message.includes('role has been changed to')) {
        let newRole = this.selectedNotification.message.split('to ')[1].trim();
        
        // 역할 뒤에 "Please accept the promotion in your notifications."가 있으면 이를 제거
        if (newRole.includes('.')) {
          newRole = newRole.split('.')[0].trim();  // "."로 나눈 후 첫 번째 부분만 취함
        }
  
        // 디버깅: newRole 값을 콘솔에 출력
        console.log('Extracted newRole:', `"${newRole}"`);
  
        // 서버에 역할 변경 요청 전송
        this.http.post<any>(`http://localhost:4002/api/accept-promotion/${user._id}`, { newRole }).subscribe({
          next: () => {
            alert('Promotion accepted.');
            // 세션에 업데이트된 역할을 반영
            user.roles = [newRole];
            sessionStorage.setItem('user', JSON.stringify(user));

            // 알림 목록에서 제거
            this.notifications = this.notifications.filter(n => n !== this.selectedNotification);
            this.selectedNotification = null;

            // 대시보드로 이동
            this.router.navigate(['/user-dashboard']);
          },
          error: (error) => {
            console.error('Error accepting promotion:', error);
          }
        });
      } else {
        console.error('Notification does not contain a role change message');
      }
    }
  }

  onClose() {
    this.selectedNotification = null;
  }
}
