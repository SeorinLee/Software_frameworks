import { Component, OnInit, OnDestroy, Inject, ViewChild, ElementRef } from '@angular/core';
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
  @ViewChild('localVideo') localVideo!: ElementRef;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef;
  
  channelId: string = '';
  groupId: string = '';  
  joinMessage: string = '';
  members: string[] = [];  
  message: string = '';  
  currentUser: any;
  channelName: string = '';  
  isCallActive = false; 

  // 메시지 타입에 profilePictureUrl, fileUrl, fileType 추가
  messages: { 
    username: string, 
    message: string, 
    fileUrl?: string, 
    fileType?: string, 
    profilePictureUrl?: string 
  }[] = [];  

  socket!: Socket;  
  fileToUpload: File | null = null;

  // WebRTC 관련 변수
  localStream!: MediaStream;
  remoteStream!: MediaStream;
  peerConnection!: RTCPeerConnection;

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
    this.currentUser = this.authService.getStoredUser();
    this.loadChannelData();
    this.loadMessages();  // 메시지 기록 불러오기 추가
  
    if (isPlatformBrowser(this.platformId)) {
      if (!this.socket || !this.socket.connected) {
        this.socket = io('http://localhost:4002', {
          path: '/socket.io'
        });
      }
      console.log('Socket connected:', this.socket.connected);  
  
      const user = this.authService.getStoredUser();
      this.socket.emit('joinChannel', { channelId: this.channelId, username: user?.username });
  
      this.socket.on('membersUpdate', (members: string[]) => {
        this.members = members;
      });
  
      // 메시지 수신 처리
      this.socket.on('newMessage', (data: { username: string, message: string, profilePictureUrl?: string, fileUrl?: string, fileType?: string }) => {
        this.messages.push({
          username: data.username,
          message: data.message,
          profilePictureUrl: data.profilePictureUrl ? `http://localhost:4002${data.profilePictureUrl}` : 'images/chatlogo.png',  // 기본 프로필 사진 설정
          fileUrl: data.fileUrl,
          fileType: data.fileType
        });
      });
            // 상대방이 통화를 종료했을 때 처리
            this.socket.on('endCall', () => {
              this.endCall(); // 통화 종료
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

 // 로컬 스트림 시작 (startCall 버튼을 눌러야만 설정)
 async startLocalStream(): Promise<void> {
  try {
    this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    if (this.localVideo) { // localVideo가 정의된 경우에만 접근
      this.localVideo.nativeElement.srcObject = this.localStream;
    }
  } catch (error) {
    console.error('Error accessing media devices:', error);
    throw error;
  }
}

// WebRTC 연결 생성
createPeerConnection(): void {
  const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
  this.peerConnection = new RTCPeerConnection(configuration);

  this.peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      this.socket.emit('candidate', { channelId: this.channelId, candidate: event.candidate });
    }
  };

  this.peerConnection.ontrack = (event) => {
    this.remoteStream = event.streams[0];
    if (this.remoteVideo) { // remoteVideo가 정의된 경우에만 접근
      this.remoteVideo.nativeElement.srcObject = this.remoteStream;
    }
  };

  this.localStream.getTracks().forEach(track => {
    this.peerConnection.addTrack(track, this.localStream);
  });
}

// WebRTC Offer 처리
async handleOffer(offer: RTCSessionDescriptionInit) {
  this.createPeerConnection();
  await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

  const answer = await this.peerConnection.createAnswer();
  await this.peerConnection.setLocalDescription(answer);

  this.socket.emit('answer', { channelId: this.channelId, answer });
}

// WebRTC Answer 처리
async handleAnswer(answer: RTCSessionDescriptionInit) {
  await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

// ICE Candidate 처리
handleCandidate(candidate: RTCIceCandidateInit) {
  this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
}

// 영상통화 시작 버튼 클릭 시 호출
async startCall(): Promise<void> {
  try {
    await this.startLocalStream();

    if (!this.peerConnection) {
      this.createPeerConnection();  // WebRTC 연결을 생성
    }

    const offer = await this.peerConnection.createOffer();  // Offer 생성
    await this.peerConnection.setLocalDescription(offer);  // Local Description 설정
  
    // 서버로 offer 전송
    this.socket.emit('offer', { channelId: this.channelId, offer });

    this.isCallActive = true;  // 통화 시작 시 비디오 화면 표시
  } catch (error) {
    console.error('Error starting call:', error);
  }
}

// 영상통화 종료
endCall(): void {
  this.socket.emit('endCall', { channelId: this.channelId });

  if (this.peerConnection) {
    this.peerConnection.close();
    this.peerConnection = null as any;
  }

  if (this.localStream) {
    this.localStream.getTracks().forEach(track => track.stop());
    this.localStream = null as any;
    if (this.localVideo) {
      this.localVideo.nativeElement.srcObject = null; // 로컬 비디오 초기화
    }
  }

  if (this.remoteStream) {
    this.remoteStream.getTracks().forEach(track => track.stop());
    this.remoteStream = null as any;
    if (this.remoteVideo) {
      this.remoteVideo.nativeElement.srcObject = null; // 원격 비디오 초기화
    }
  }

  this.isCallActive = false;  // 통화 종료 시 비디오 화면 숨기기
}


  loadChannelData() {
    const headers = { 'user': JSON.stringify(this.authService.getStoredUser()) };
    this.http.get<any>(`http://localhost:4002/api/channels/${this.channelId}`, { headers }).subscribe(data => {
      this.joinMessage = data.joinMessage;  
      this.members = data.members;  
      this.channelName = data.channelName; 
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
          const fileUrl = response.fileUrl ? `http://localhost:4002${response.fileUrl}` : null;  // 파일 URL 확인
          const fileType = response.fileType || null;
          const profilePictureUrl = user?.profilePictureUrl ? `http://localhost:4002${user.profilePictureUrl}` : 'images/chatlogo.png';  // 프로필 사진 URL 가져오기
  
          // 서버로부터 파일 URL과 파일 유형을 받은 후 소켓으로 메시지를 전송
          this.socket.emit('sendMessage', {
            channelId: this.channelId,
            username: user?.username,
            message: this.message.trim(),  // 텍스트 메시지
            fileUrl: fileUrl,  // 파일 URL (없을 수 있음)
            fileType: fileType,  // 파일 타입 (없을 수 있음)
            profilePictureUrl: profilePictureUrl  // 프로필 사진 URL 추가
          });
  
          // 전송 후 입력 필드 초기화
          this.fileToUpload = null;
          this.message = '';  // 텍스트 필드 초기화
        }, error => {
          console.error('Error uploading file and message:', error);
        });
    }
  }
  
  // 채널 메시지 기록 불러오기 함수
  loadMessages(): void {
    this.http.get<any[]>(`http://localhost:4002/api/channels/${this.channelId}/messages`)
      .subscribe(messages => {
        this.messages = messages.map(msg => ({
          ...msg,
          profilePictureUrl: msg.profilePictureUrl ? `http://localhost:4002${msg.profilePictureUrl}` : 'images/chatlogo.png'  // 기본 프로필 사진 설정
        }));
      }, error => {
        console.error('Failed to load messages:', error);
      });
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
