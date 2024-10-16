import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';  // Router 추가
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service';  // AuthService 추가
import { CommonModule } from '@angular/common';  // CommonModule 추가
import { RouterModule } from '@angular/router';  // RouterModule 추가

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  standalone: true,  // standalone 컴포넌트로 설정
  imports: [CommonModule, RouterModule],  // CommonModule 및 RouterModule 추가
})
export class ChatComponent implements OnInit {
  channelId: string = '';
  groupId: string = '';  // groupId 추가
  joinMessage: string = '';
  members: string[] = [];  // 참가한 유저 목록

  constructor(
    private route: ActivatedRoute, 
    private http: HttpClient, 
    private authService: AuthService,
    private router: Router  // Router 주입
  ) {}

  ngOnInit(): void {
    this.channelId = this.route.snapshot.paramMap.get('id') || '';
    this.groupId = this.route.snapshot.queryParamMap.get('groupId') || '';  // queryParam에서 groupId 가져오기
    this.loadChannelData();
  }

  // 서버에서 채널 참가 메시지와 멤버 목록을 가져옴
  loadChannelData() {
    const headers = { 'user': JSON.stringify(this.authService.getStoredUser()) };
    this.http.get<any>(`http://localhost:4002/api/channels/${this.channelId}`, { headers }).subscribe(data => {
      this.joinMessage = data.joinMessage;  // 참가 메시지 설정
      this.members = data.members;  // 참가한 유저 목록 설정
    });
  }

  // 채널 퇴장
  exitChannel() {
    const headers = { 'user': JSON.stringify(this.authService.getStoredUser()) };
    this.http.post<any>(`http://localhost:4002/api/channels/${this.channelId}/exit`, {}, { headers }).subscribe(data => {
      alert(data.exitMessage);  // 퇴장 메시지 표시
      this.router.navigate([`/groups/${this.groupId}`]);  // group-detail 페이지로 리디렉션
    });
  }
}
