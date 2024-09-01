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
    const userRole = this.authService.getUserRole(); // 사용자의 역할을 가져옴
    
    if (!userRole) {
      this.router.navigate(['/login']);
      return false;
    }

    console.log('AuthGuard checking:', { expectedRoles, userRole });

    // userRole의 문자열 부분만 추출하여 비교
    const normalizedUserRole = userRole.match(/^[a-zA-Z]+/)?.[0];
    
    if (!this.authService.isAuthenticated() || !normalizedUserRole) {
      this.router.navigate(['/login']);
      return false;
    }

    // 기대하는 역할이 배열인 경우 처리
    if (Array.isArray(expectedRoles)) {
      if (!expectedRoles.includes(normalizedUserRole)) {
        this.router.navigate(['/login']);
        return false;
      }
    } else {
      if (normalizedUserRole !== expectedRoles) {
        this.router.navigate(['/login']);
        return false;
      }
    }
    return true;
  }
}
