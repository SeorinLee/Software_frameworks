import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'  // root에서 자동으로 주입되도록 설정
})
export class ChatService {
  private socket: Socket;
  private readonly serverUrl = 'http://localhost:4002';  // 서버 URL

  constructor() {
    // WebSocket 서버에 연결
    this.socket = io(this.serverUrl, {
      path: '/socket.io',  // 명시적으로 경로 설정
      withCredentials: true,
      transports: ['websocket', 'polling']  // WebSocket을 우선 사용, 폴링을 폴백으로 사용
    });

    // 연결 이벤트 처리
    this.socket.on('connect', () => {
      console.log('WebSocket connected with ID:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('WebSocket connection error:', error.message);
    });
  }

  // 서버에 채널 참가 요청
  joinChannel(channelId: string): void {
    if (this.socket && this.socket.connected) {
      console.log(`Joining channel: ${channelId}`);
      this.socket.emit('joinChannel', channelId);
    } else {
      console.error('Socket is not connected');
    }
  }

  // 메시지 전송
  sendMessage(message: any, channelId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('sendMessage', message, channelId);
    } else {
      console.error('Socket is not connected, cannot send message');
    }
  }

  // 서버로부터 수신된 메시지 처리
  onReceiveMessage(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('receiveMessage', (message) => {
        console.log('Message received:', message);
        observer.next(message);
      });
    });
  }

  // 서버로부터 유저가 채널에 참가했다는 이벤트 수신
  onUserJoined(): Observable<string> {
    return new Observable(observer => {
      this.socket.on('userJoined', (message: string) => {
        console.log('User joined:', message);
        observer.next(message);
      });
    });
  }

  // 유저가 채널을 떠났다는 이벤트 수신 (필요 시)
  onUserLeft(): Observable<string> {
    return new Observable(observer => {
      this.socket.on('userLeft', (message: string) => {
        console.log('User left:', message);
        observer.next(message);
      });
    });
  }

  // 연결 종료 시 처리
  disconnect(): void {
    if (this.socket) {
      console.log('Disconnecting socket');
      this.socket.disconnect();
    }
  }
}
