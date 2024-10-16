import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ChannelManagementComponent } from './channel-management.component';

describe('ChannelManagementComponent', () => {
  let component: ChannelManagementComponent;
  let fixture: ComponentFixture<ChannelManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        ChannelManagementComponent // declarations에서 imports로 변경
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChannelManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
