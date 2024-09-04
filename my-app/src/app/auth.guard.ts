import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const expectedRoles = route.data['role']; // 기대하는 역할은 배열로 처리
    const user = this.authService.getStoredUser(); // 로그인된 사용자 정보 가져오기
    const userRole = user?.roles?.[0]; // 사용자의 역할을 배열에서 첫 번째 값으로 가져옴

    if (!userRole) {
      this.router.navigate(['/login']);
      return false;
    }

    console.log('AuthGuard checking:', { expectedRoles, userRole });

    // 기대하는 역할이 배열인 경우 처리
    if (Array.isArray(expectedRoles)) {
      if (!expectedRoles.includes(userRole.toLowerCase())) {
        this.router.navigate(['/login']);
        return false;
      }
    } else {
      if (userRole.toLowerCase() !== expectedRoles) {
        this.router.navigate(['/login']);
        return false;
      }
    }

    return true;
  }
}
