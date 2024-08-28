import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  login(username: string, password: string): Observable<boolean> {
    // 간단한 예제로, 실제 로그인 로직을 구현해야 합니다.
    if (username === 'super' && password === '123') {
      return of(true);
    } else {
      return of(false);
    }
  }
}
