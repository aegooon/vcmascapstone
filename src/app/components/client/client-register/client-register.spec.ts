import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientRegister } from './client-register';

describe('ClientRegister', () => {
  let component: ClientRegister;
  let fixture: ComponentFixture<ClientRegister>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientRegister],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientRegister);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
