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
    // 역할 승격 메시지 확인
    if (this.selectedNotification.message.includes('role has been changed to')) {
      let newRole = this.selectedNotification.message.split('to ')[1].trim();
      
      // 역할 뒤에 "Please accept the promotion in your notifications." 제거
      if (newRole.includes('.')) {
        newRole = newRole.split('.')[0].trim();
      }

      // 디버깅용 로그
      console.log('Extracted newRole:', `"${newRole}"`);

      // newRole이 유효한지 확인
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

    // 그룹 초대 메시지 확인
    } else if (this.selectedNotification.message.includes('invited to join group')) {
      let groupId = this.selectedNotification.message.split('group ')[1].trim();
      
      // 마침표 제거
      groupId = groupId.replace(/\.$/, '');  // 그룹 ID에서 마지막 마침표 제거

      // 유저가 이미 그룹에 속해 있는지 확인
      this.http.get<any>(`http://localhost:4002/api/users/${user.id}/groups`).subscribe({
        next: (groupsData) => {
          // groupsData가 배열인지 확인하고 배열로 변환
          const groups = Array.isArray(groupsData.groups) ? groupsData.groups : [];

          const isInGroup = groups.some((g: any) => g.groupId === groupId);
          if (isInGroup) {
            alert('You are already a member of this group.');
          } else {
            // 그룹 참여 요청
            this.http.post<any>(`http://localhost:4002/api/groups/${groupId}/join`, { userId: user.id }).subscribe({
              next: () => {
                alert('Group join request accepted.');
                this.router.navigate(['/group-dashboard']);
              },
              error: (error) => {
                console.error('Error accepting group invitation:', error);
              }
            });
          }
        },
        error: (error) => {
          console.error('Error fetching user groups:', error);
        }
      });

    } else {
      console.error('Notification does not contain promotion or group invitation information.');
    }
  }
}

  
  

  onClose() {
    this.selectedNotification = null;
  }
}
