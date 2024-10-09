import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ChatService } from '../services/chat.service';  // ChatService 가져오기
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';  // FormsModule 추가

@Component({
  selector: 'app-chat',
  standalone: true,  // Standalone 컴포넌트로 설정
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  imports: [CommonModule, FormsModule]  // CommonModule과 FormsModule 추가
})
export class ChatComponent implements OnInit, OnDestroy {
  messages: string[] = [];
  newMessage: string = '';
  channelId: string = '';

  constructor(private route: ActivatedRoute, private chatService: ChatService) {}

  ngOnInit(): void {
    // URL에서 채널 ID를 가져옴
    this.channelId = this.route.snapshot.paramMap.get('id')!;

    // 채널에 참가
    this.chatService.joinChannel(this.channelId);

    // 서버로부터 메시지 수신
    this.chatService.onReceiveMessage().subscribe((message: any) => {
      const formattedMessage = `${message.user}: ${message.content}`;
      this.messages.push(formattedMessage);
    });

    // 다른 사용자가 채널에 참가했을 때 알림 수신
    this.chatService.onUserJoined().subscribe((message: string) => {
      this.messages.push(`System: ${message}`);
    });
  }

  sendMessage(): void {
    if (this.newMessage.trim()) {
      const messageToSend = { user: 'You', content: this.newMessage };

      // 서비스로 메시지 전송
      this.chatService.sendMessage(messageToSend, this.channelId);

      // 입력창 초기화
      this.newMessage = '';
    }
  }

  ngOnDestroy(): void {
    // 컴포넌트가 파괴될 때 연결 해제
    this.chatService.disconnect();
  }
}
