import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyJoinedGroupsComponent } from './my-joined-groups.component';

describe('MyJoinedGroupsComponent', () => {
  let component: MyJoinedGroupsComponent;
  let fixture: ComponentFixture<MyJoinedGroupsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyJoinedGroupsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyJoinedGroupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
