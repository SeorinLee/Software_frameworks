import { Component, OnInit } from '@angular/core';
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
export class NotificationComponent implements OnInit {
  notifications: any[] = [];
  selectedNotification: any = null;
  groups: any[] = [];  // 그룹 목록을 저장할 속성 추가

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.loadNotifications();
    this.loadGroups();  // 그룹 목록을 불러오는 함수 추가
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

  // 그룹 목록을 불러오는 함수
  loadGroups() {
    this.http.get<any[]>('http://localhost:4002/api/groups').subscribe({
      next: (data) => {
        this.groups = data;  // 그룹 데이터를 저장
      },
      error: (error) => {
        console.error('Error loading groups:', error);
      }
    });
  }

  onNotificationClick(notification: any) {
    this.selectedNotification = notification;
  }

  onAccept() {
    const adminUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');

    if (adminUser && adminUser.id && this.selectedNotification) {
      // 역할 승격 메시지 확인
      if (this.selectedNotification.message.includes('role has been changed to')) {
        this.handleRoleAcceptance(adminUser.id);
      } 
      // 그룹 가입 요청 승인 처리
      else if (this.selectedNotification.message.includes('has requested to join the group')) {
        this.handleGroupJoinAcceptance();
      } 
      else {
        console.error('Notification does not contain promotion or group invitation information.');
      }
    }
  }

  private handleRoleAcceptance(userId: string) {
    const newRole = this.extractNewRoleFromNotification();
    
    if (['Super Admin', 'Group Admin', 'User'].includes(newRole)) {
      this.http.post<any>(`http://localhost:4002/api/accept-promotion/${userId}`, { newRole }).subscribe({
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
  }

  private extractNewRoleFromNotification(): string {
    const message = this.selectedNotification.message;
    let newRole = message.split('to ')[1].trim();
    
    // 불필요한 텍스트 제거
    if (newRole.includes('.')) {
      newRole = newRole.split('.')[0].trim();
    }
    
    return newRole;
  }

  private handleGroupJoinAcceptance() {
    const groupName = this.selectedNotification.message.split('to join the group ')[1].trim();
    const group = this.groups.find((g: any) => g.name === groupName);

    if (group) {
      const requestingUserId = this.selectedNotification.requestingUserId || this.selectedNotification.userId;

      if (requestingUserId) {
        this.http.post<any>(`http://localhost:4002/api/groups/${group.id}/approve/${requestingUserId}`, {}).subscribe({
          next: () => {
            alert('Group join request accepted.');
            this.loadNotifications();  // 알림 목록 다시 불러오기
          },
          error: (error) => {
            console.error('Error accepting group join request:', error);
          }
        });
      } else {
        console.error('No userId found in notification.');
      }
    } else {
      console.error('Group not found.');
    }
  }

  onClose() {
    this.selectedNotification = null;
  }
}
