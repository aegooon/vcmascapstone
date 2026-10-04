import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientNotifications } from './client-notifications';

describe('ClientNotifications', () => {
  let component: ClientNotifications;
  let fixture: ComponentFixture<ClientNotifications>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientNotifications],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientNotifications);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
