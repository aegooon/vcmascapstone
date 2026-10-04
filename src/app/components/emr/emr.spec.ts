import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Emr } from './emr';

describe('Emr', () => {
  let component: Emr;
  let fixture: ComponentFixture<Emr>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Emr],
    }).compileComponents();

    fixture = TestBed.createComponent(Emr);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
