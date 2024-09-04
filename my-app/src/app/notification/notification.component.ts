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
      // 메시지 내 그룹 ID 형식을 변경 또는 JSON 데이터에서 직접 그룹 ID를 받을 수 있는 구조로 개선
      const groupIdMatch = this.selectedNotification.message.match(/group (\w+)/);  // 숫자뿐 아니라 문자로도 그룹 ID 추출 가능
  
      if (groupIdMatch && groupIdMatch[1]) {
        const groupId = groupIdMatch[1];  // 그룹 ID 추출
        console.log(`Extracted groupId: ${groupId}`);  // 디버깅용 로그 추가
  
        this.http.post<any>(`http://localhost:4002/api/groups/${groupId}/accept-invite`, { userId: user.id }).subscribe({
          next: () => {
            alert('Invitation accepted. The group has been added to your dashboard.');
            this.router.navigate(['/user-dashboard']);  // 대시보드로 이동
          },
          error: (error) => {
            if (error.status === 404) {
              console.error('Error: Group or user not found.');
            } else if (error.status === 400) {
              console.error('Error: User is not invited to this group.');
            } else {
              console.error('Error accepting invitation:', error);
            }
          }
        });
      } else {
        console.error('Group ID not found in the notification message');
      }
    }
  }  
  
  
  

  onClose() {
    this.selectedNotification = null;
  }
}
