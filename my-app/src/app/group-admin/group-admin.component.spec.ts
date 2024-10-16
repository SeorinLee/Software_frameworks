import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GroupAdminComponent } from './group-admin.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

describe('GroupAdminComponent', () => {
  let component: GroupAdminComponent;
  let fixture: ComponentFixture<GroupAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        GroupAdminComponent  // standalone 컴포넌트는 imports에 추가
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GroupAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
