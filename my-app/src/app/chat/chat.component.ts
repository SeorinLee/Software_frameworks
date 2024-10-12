import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { io } from 'socket.io-client';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  imports: [CommonModule, FormsModule]
})
export class ChatComponent implements OnInit {
  messages: { user: string, content: string, timestamp: Date, userId: string, fileUrl?: string, fileType?: string }[] = [];
  newMessage: string = '';
  channelId: string = '';
  currentUser: any;
  activeUsers: string[] = [];  // 접속한 사용자 목록
  selectedFile: File | null = null; // 선택된 파일을 저장

  private socket: any;

  constructor(private route: ActivatedRoute, private http: HttpClient, private authService: AuthService) {}

  ngOnInit(): void {
    this.channelId = this.route.snapshot.paramMap.get('id')!;
    this.currentUser = this.authService.getStoredUser();

    this.loadMessages();
    
    this.socket = io('http://localhost:4200');
    console.log('Socket connected:', this.socket.connected);

    this.socket.emit('joinChannel', this.channelId, this.currentUser.username);

    this.socket.on('receiveMessage', (message: { user: string, content: string, userId: string, fileUrl?: string, fileType?: string }) => {
      this.messages.push({ ...message, timestamp: new Date() });
    });

    this.socket.on('userJoined', (data: { username: string }) => {
      this.activeUsers.push(data.username);
      this.messages.push({ user: 'System', content: `${data.username}가 입장했습니다.`, timestamp: new Date(), userId: '' });
      console.log(`${data.username} has joined the channel: ${this.channelId}`);
      this.loadActiveUsers();
    });

    setInterval(() => {
      this.loadMessages();
    }, 5000);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  loadActiveUsers(): void {
    this.http.get<string[]>(`http://localhost:4002/api/channels/${this.channelId}/active-users`).subscribe({
      next: (data) => {
        this.activeUsers = data;
      },
      error: (error) => {
        console.error('Error loading active users:', error);
      }
    });
  }

  loadMessages(): void {
    this.http.get<any[]>(`http://localhost:4002/api/channels/${this.channelId}/messages`).subscribe({
      next: (data) => {
        this.messages = data.map(message => ({
          ...message,
          timestamp: new Date()
        }));
      },
      error: (error) => {
        console.error('Error loading messages:', error);
      }
    });
  }

  sendMessage(): void {
    if (this.newMessage.trim() || this.selectedFile) {
        const messageToSend: any = { 
            content: this.newMessage.trim(),  // 텍스트 메시지 내용 
            userId: this.currentUser._id,     // 현재 사용자의 MongoDB ID를 사용
            fileUrl: '',                       // 초기 fileUrl 설정
            fileType: this.selectedFile ? this.selectedFile.type.split('/')[0] : null 
        };

        const formData = new FormData();
        
        // 파일이 선택된 경우에만 추가
        if (this.selectedFile) {
            formData.append('file', this.selectedFile);
        }

        // 메시지 데이터를 FormData에 추가
        formData.append('message', JSON.stringify(messageToSend));

        // 파일이 선택된 경우, FormData를 통해 메시지 전송
        if (this.selectedFile) {
            this.http.post(`http://localhost:4002/api/channels/${this.channelId}/messages`, formData).subscribe({
                next: (response: any) => {
                    // 서버에서 fileUrl을 받아와서 업데이트
                    messageToSend.fileUrl = response.fileUrl;
                    this.messages.push({ ...messageToSend, timestamp: new Date() });
                    this.newMessage = '';
                    this.selectedFile = null;  // 파일 선택 초기화
                    
                    this.socket.emit('receiveMessage', messageToSend);
                },
                error: (error) => {
                    console.error('Error sending message:', error);
                }
            });
        } else {
            // 파일이 선택되지 않은 경우, 일반 메시지를 전송
            this.http.post(`http://localhost:4002/api/channels/${this.channelId}/messages`, messageToSend).subscribe({
                next: () => {
                    this.messages.push({ ...messageToSend, timestamp: new Date() });
                    this.newMessage = '';
                    
                    this.socket.emit('receiveMessage', messageToSend);
                },
                error: (error) => {
                    console.error('Error sending message:', error);
                }
            });
        }
    }
}


  isCurrentUserMessage(message: { userId: string }): boolean {
    return message.userId === this.currentUser.id;
  }
}
