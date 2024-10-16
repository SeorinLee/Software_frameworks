import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing'; // HttpClientTestingModule을 import합니다.
import { NavBarComponent } from './nav-bar.component';
import { AuthService } from '../auth.service'; // AuthService import
import { RouterTestingModule } from '@angular/router/testing'; // RouterTestingModule을 추가합니다.

describe('NavBarComponent', () => {
  let component: NavBarComponent;
  let fixture: ComponentFixture<NavBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule, // HttpClientTestingModule 추가
        RouterTestingModule, // RouterTestingModule 추가
        NavBarComponent
      ],
      providers: [AuthService] // AuthService를 providers에 추가합니다.
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
