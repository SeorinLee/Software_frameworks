import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat',
  standalone: true,
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  imports: [CommonModule, FormsModule]
})
export class ChatComponent implements OnInit {
  messages: string[] = [];
  newMessage: string = '';
  channelId: string = '';

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    // URL에서 채널 ID를 가져옴
    this.channelId = this.route.snapshot.paramMap.get('id')!;

    // 기존 메시지 가져오기
    this.loadMessages();

    // 5초마다 새로운 메시지를 불러옴 (주기적 폴링)
    setInterval(() => {
      this.loadMessages();
    }, 5000);
  }

  // 채널의 메시지를 서버에서 가져오는 함수
  loadMessages(): void {
    this.http.get<any[]>(`http://localhost:4002/api/channels/${this.channelId}/messages`).subscribe({
      next: (data) => {
        this.messages = data.map(message => `${message.user}: ${message.content}`);
      },
      error: (error) => {
        console.error('Error loading messages:', error);
      }
    });
  }

  // 메시지 전송
  sendMessage(): void {
    if (this.newMessage.trim()) {
      const messageToSend = { user: 'You', content: this.newMessage };

      // 서버로 메시지 전송
      this.http.post(`http://localhost:4002/api/channels/${this.channelId}/messages`, messageToSend).subscribe({
        next: () => {
          this.messages.push(`${messageToSend.user}: ${messageToSend.content}`);
          this.newMessage = '';  // 입력창 초기화
        },
        error: (error) => {
          console.error('Error sending message:', error);
        }
      });
    }
  }
}
