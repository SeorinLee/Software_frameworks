import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NavBarComponent } from '../nav-bar/nav-bar.component';
import { CommonModule } from '@angular/common'; // Angular CommonModule 추가

@Component({
  selector: 'app-group-detail',
  standalone: true,  // standalone 컴포넌트로 설정
  templateUrl: './group-detail.component.html',
  styleUrls: ['./group-detail.component.css'],
  imports: [CommonModule, NavBarComponent]
})
export class GroupDetailComponent implements OnInit {
  groupId: string = '';
  group: any;
  groupMembers: any[] = [];  // 그룹 멤버 데이터는 배열이어야 함
  groupChannels: any[] = []; // 그룹 채널 데이터는 배열이어야 함
  showMembers: boolean = true; // 기본적으로 멤버 보기 활성화
  showChannels: boolean = false; // 채널 보기는 기본적으로 비활성화

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit() {
    this.groupId = this.route.snapshot.paramMap.get('id')!;
    this.loadGroupDetails();
    this.loadGroupMembers();
    // 기본적으로 멤버를 로드하므로 채널은 나중에 따로 클릭 시 로드
  }

  // 그룹 정보 로드
  loadGroupDetails() {
    this.http.get(`http://localhost:4002/api/groups/${this.groupId}`)
      .subscribe({
        next: (data) => {
          this.group = data;
        },
        error: (error) => {
          console.error('Error loading group details:', error);
        }
      });
  }

  // 그룹 멤버 로드
  loadGroupMembers() {
    this.http.get<any[]>(`http://localhost:4002/api/groups/${this.groupId}/members`)  // <any[]>로 데이터 타입 지정
      .subscribe({
        next: (data: any[]) => {  // 서버로부터 배열이 반환됨을 명시
          this.groupMembers = data;
        },
        error: (error) => {
          console.error('Error loading group members:', error);
        }
      });
  }

// 그룹 채널 로드
loadGroupChannels() {
  this.http.get<any[]>(`http://localhost:4002/api/groups/${this.groupId}/channels`)
    .subscribe({
      next: (data: any[]) => {
        // 서버에서 배열이 올 것으로 기대
        if (Array.isArray(data)) {
          this.groupChannels = data;
        } else {
          console.error('Unexpected data format:', data);
          alert('Failed to load channels. Please try again later.');
        }
      },
      error: (error) => {
        console.error('Error loading group channels:', error);
        alert('Error loading group channels: ' + error.message);
      }
    });
}


  // 채널을 클릭하면 데이터를 로드하도록 함수 호출
  showChannelsTab() {
    this.showMembers = false;
    this.showChannels = true;
    this.loadGroupChannels(); // 채널 데이터를 가져오는 함수 호출
  }

  // 멤버를 클릭하면 다시 멤버 리스트가 보이게 설정
  showMembersTab() {
    this.showMembers = true;
    this.showChannels = false;
  }
}
