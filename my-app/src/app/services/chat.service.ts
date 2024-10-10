import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'  // root에서 자동으로 주입되도록 설정
})
export class ChatService {
  private socket!: Socket;  // '!'로 소켓 초기화 지연을 명시
  private readonly serverUrl = 'http://localhost:4002';  // 서버 URL

  constructor() {
    this.connectToSocket();  // 소켓 연결 초기화
  }

  // 소켓 연결 설정
  private connectToSocket(): void {
    this.socket = io(this.serverUrl, {
      path: '/socket.io',
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    // 소켓 연결 성공 시 이벤트
    this.socket.on('connect', () => {
      console.log('WebSocket connected with ID:', this.socket.id);
    });

    // 소켓 연결 오류 시 이벤트
    this.socket.on('connect_error', (error: any) => {
      console.error('WebSocket connection error:', error.message);
    });

    // 소켓 연결 종료 시 이벤트
    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });
  }

  // 채널에 참가하는 메서드
  joinChannel(channelId: string): void {
    if (this.socket && this.socket.connected) {
      console.log(`Joining channel: ${channelId}`);
      this.socket.emit('joinChannel', channelId);
    } else {
      console.error('Socket is not connected yet. Waiting for connection.');
      // 소켓이 연결되면 자동으로 채널에 참가
      this.socket.on('connect', () => {
        console.log('Socket connected, joining channel:', channelId);
        this.socket.emit('joinChannel', channelId);
      });
    }
  }

  // 메시지를 서버에 전송하는 메서드
  sendMessage(message: any, channelId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('sendMessage', message, channelId);
    } else {
      console.error('Socket is not connected, cannot send message');
    }
  }

  // 서버에서 메시지를 받는 메서드
  onReceiveMessage(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('receiveMessage', (message) => {
        console.log('Message received:', message);
        observer.next(message);
      });
    });
  }

  // 서버에서 유저가 채널에 참가했다는 알림을 받는 메서드
  onUserJoined(): Observable<string> {
    return new Observable(observer => {
      this.socket.on('userJoined', (message: string) => {
        console.log('User joined:', message);
        observer.next(message);
      });
    });
  }

  // 소켓 연결을 해제하는 메서드
  disconnect(): void {
    if (this.socket) {
      console.log('Disconnecting socket');
      this.socket.disconnect();
    }
  }
}
