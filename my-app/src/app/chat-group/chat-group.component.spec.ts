import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatGroupComponent } from './chat-group.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

describe('ChatGroupComponent', () => {
  let component: ChatGroupComponent;
  let fixture: ComponentFixture<ChatGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatGroupComponent, HttpClientTestingModule, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
