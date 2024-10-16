import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';  
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service';  
import { CommonModule } from '@angular/common';  
import { RouterModule } from '@angular/router';  
import { io, Socket } from 'socket.io-client';  
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';  
import { PLATFORM_ID } from '@angular/core';  

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
  messages: { username: string, message: string, fileUrl?: string, fileType?: string }[] = [];  // 파일 URL과 타입 추가
  socket!: Socket;  
  fileToUpload: File | null = null;    

  constructor(
    private route: ActivatedRoute, 
    private http: HttpClient, 
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.channelId = this.route.snapshot.paramMap.get('id') || '';
    this.groupId = this.route.snapshot.queryParamMap.get('groupId') || '';  
    this.loadChannelData();
  
    if (isPlatformBrowser(this.platformId)) {
      this.socket = io('http://localhost:4002', {
        path: '/socket.io'
      });
      console.log('Socket connected:', this.socket.connected);  
  
      const user = this.authService.getStoredUser();
      this.socket.emit('joinChannel', { channelId: this.channelId, username: user?.username });
  
      this.socket.on('membersUpdate', (members: string[]) => {
        this.members = members;
      });
  
      // 메시지 수신 처리
      this.socket.on('newMessage', (data: { username: string, message: string }) => {
        this.messages.push(data);  
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
    
    // 텍스트 메시지나 파일 중 하나라도 있으면 메시지를 전송
    if (this.message.trim() || this.fileToUpload) {
      const formData = new FormData();
  
      if (this.fileToUpload) {
        // 파일이 있으면 FormData에 추가
        formData.append('file', this.fileToUpload);
      }
  
      // 텍스트 메시지와 사용자 정보 추가
      formData.append('username', user?.username || '');
      formData.append('message', this.message.trim());
  
      // 파일 및 메시지 업로드 처리
      this.http.post<any>(`http://localhost:4002/api/channels/${this.channelId}/upload`, formData)
        .subscribe(response => {
          console.log('File and message uploaded successfully', response);
          const fileUrl = response.fileUrl ? `http://localhost:4002${response.fileUrl}` : null;
          const fileType = response.fileType || null;
  
          // 서버로부터 파일 URL과 파일 유형을 받은 후 소켓으로 메시지를 전송
          this.socket.emit('sendMessage', {
            channelId: this.channelId,
            username: user?.username,
            message: this.message.trim(),  // 텍스트 메시지
            fileUrl: fileUrl,  // 파일 URL (없을 수 있음)
            fileType: fileType  // 파일 타입 (없을 수 있음)
          });
  
          // 전송 후 입력 필드 초기화
          this.fileToUpload = null;
          this.message = '';  // 텍스트 필드 초기화
        }, error => {
          console.error('Error uploading file and message:', error);
        });
    }
  }
  

  handleFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.fileToUpload = input.files[0];
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
