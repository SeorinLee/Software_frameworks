import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';  
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service';  
import { CommonModule } from '@angular/common';  
import { RouterModule } from '@angular/router';  
import { io, Socket } from 'socket.io-client';  
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';  // isPlatformBrowser 추가
import { PLATFORM_ID } from '@angular/core';  // PLATFORM_ID 추가

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  standalone: true,  
  imports: [CommonModule, RouterModule, FormsModule],  
})
export class ChatComponent implements OnInit, OnDestroy {
  channelId: string = '';
  groupId: string = '';  
  joinMessage: string = '';
  members: string[] = [];  
  message: string = '';  
  messages: { username: string, message: string }[] = [];  // 채팅 메시지 목록 저장
  socket!: Socket;  

  constructor(
    private route: ActivatedRoute, 
    private http: HttpClient, 
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object  // 플랫폼 ID 주입
  ) {}

  ngOnInit(): void {
    this.channelId = this.route.snapshot.paramMap.get('id') || '';
    this.groupId = this.route.snapshot.queryParamMap.get('groupId') || '';  
    this.loadChannelData();
  
    if (isPlatformBrowser(this.platformId)) {
      this.socket = io('http://localhost:4002', {
        path: '/socket.io'  // 서버의 소켓 경로와 일치하도록 명시
      });
      console.log('Socket connected:', this.socket.connected);  // 소켓 연결 상태 확인
  
      const user = this.authService.getStoredUser();
      this.socket.emit('joinChannel', { channelId: this.channelId, username: user?.username });
  
      this.socket.on('membersUpdate', (members: string[]) => {
        console.log('Members updated:', members);  // 멤버 리스트 콘솔 로그
        this.members = members;  // 유저 리스트 업데이트
      });
  
      // 메시지 수신
      this.socket.on('newMessage', (data: { username: string, message: string }) => {
        console.log(`${data.username}: ${data.message}`);  // 콘솔에 메시지 출력 (디버깅용)
        this.messages.push(data);  // 메시지 목록에 추가
      });
    }
  }
  

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      const user = this.authService.getStoredUser();
      this.socket.emit('leaveChannel', { channelId: this.channelId, username: user?.username });
      this.socket.disconnect();
    }
  }

  loadChannelData() {
    const headers = { 'user': JSON.stringify(this.authService.getStoredUser()) };
    this.http.get<any>(`http://localhost:4002/api/channels/${this.channelId}`, { headers }).subscribe(data => {
      this.joinMessage = data.joinMessage;  
      this.members = data.members;  
    });
  }

  sendMessage(): void {
    const user = this.authService.getStoredUser();
    if (this.message.trim()) {
      this.socket.emit('sendMessage', { channelId: this.channelId, username: user?.username, message: this.message });
      this.message = '';  // 메시지 전송 후 입력 필드 초기화
    }
  }

  exitChannel() {
    const headers = { 'user': JSON.stringify(this.authService.getStoredUser()) };
    this.http.post<any>(`http://localhost:4002/api/channels/${this.channelId}/exit`, {}, { headers }).subscribe(data => {
      alert(data.exitMessage);  
      this.router.navigate([`/groups/${this.groupId}`]);  
    });
  }
}
