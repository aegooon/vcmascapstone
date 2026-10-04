import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SchedulingComponent } from './scheduling';

describe('SchedulingComponent', () => {
  let component: SchedulingComponent;
  let fixture: ComponentFixture<SchedulingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchedulingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SchedulingComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
