import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientAppointments } from './client-appointments';

describe('ClientAppointments', () => {
  let component: ClientAppointments;
  let fixture: ComponentFixture<ClientAppointments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientAppointments],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientAppointments);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
