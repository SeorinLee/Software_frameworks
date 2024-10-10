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
  messages: { user: string, content: string, timestamp: Date, userId: string }[] = [];
  newMessage: string = '';
  channelId: string = '';
  currentUser: any;

  private socket: any;

  constructor(private route: ActivatedRoute, private http: HttpClient, private authService: AuthService) {}

  ngOnInit(): void {
    this.channelId = this.route.snapshot.paramMap.get('id')!;
    this.currentUser = this.authService.getStoredUser();
    console.log('Current User ID:', this.currentUser.id); // 추가: 현재 사용자 ID 확인

    this.loadMessages();
    
    this.socket = io('http://localhost:4200');
    this.socket.emit('joinChannel', this.channelId);

    this.socket.on('receiveMessage', (message: { user: string, content: string, userId: string }) => {
      if (message.userId) {  // userId가 존재하는지 확인
        this.messages.push({ ...message, timestamp: new Date() });
      } else {
        console.warn('Received message with undefined userId', message);
      }
      console.log('New message received:', message);
    });
    

    this.socket.on('userJoined', (username: string) => {
      this.messages.push({ user: 'System', content: `${username}가 입장했습니다.`, timestamp: new Date(), userId: '' });
    });

    setInterval(() => {
      this.loadMessages();
    }, 5000);
  }

  loadMessages(): void {
    this.http.get<any[]>(`http://localhost:4002/api/channels/${this.channelId}/messages`).subscribe({
      next: (data) => {
        this.messages = data.map(message => ({
          ...message,
          timestamp: new Date() // 타임스탬프 업데이트
        }));
        console.log('Loaded Messages:', this.messages); 
      },
      error: (error) => {
        console.error('Error loading messages:', error);
      }
    });
  }
  

  sendMessage(): void {
    if (this.newMessage.trim()) {
      const messageToSend = { 
        user: this.currentUser.username, 
        content: this.newMessage, 
        userId: this.currentUser.id  // userId 포함
      };
  
      this.http.post(`http://localhost:4002/api/channels/${this.channelId}/messages`, messageToSend).subscribe({
        next: () => {
          this.messages.push({ ...messageToSend, timestamp: new Date() });
          this.newMessage = '';  // 입력창 초기화
          
          // 소켓을 통해 메시지 전송
          this.socket.emit('receiveMessage', messageToSend);
        },
        error: (error) => {
          console.error('Error sending message:', error);
        }
      });
    }
  }
  

  isCurrentUserMessage(message: { userId: string }): boolean {
    console.log('Current User ID:', this.currentUser.id);
    console.log('Message User ID:', message.userId);
    return message.userId === this.currentUser.id;
  }
}
