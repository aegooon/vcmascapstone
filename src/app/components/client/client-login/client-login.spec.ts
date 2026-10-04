import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientLogin } from './client-login';

describe('ClientLogin', () => {
  let component: ClientLogin;
  let fixture: ComponentFixture<ClientLogin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientLogin],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientLogin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
