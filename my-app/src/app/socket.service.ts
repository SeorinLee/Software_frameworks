import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;

  constructor() {
    this.socket = io('http://localhost:4002');  // 서버 주소 설정
  }

  joinChannel(channelId: string, username?: string) {
    this.socket.emit('joinChannel', { channelId, username });
  }

  sendMessage(channelId: string, username: string, message: string) {
    this.socket.emit('sendMessage', { channelId, username, message });
  }

  getMessage(): Observable<{ username: string, message: string }> {
    return new Observable(observer => {
      this.socket.on('receiveMessage', (data) => {
        observer.next(data);  // 서버로부터 메시지를 수신하여 observer에 전달
      });
    });
  }
}
