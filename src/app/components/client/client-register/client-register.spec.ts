import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientRegisterComponent } from './client-register';

describe('ClientRegisterComponent', () => {
  let component: ClientRegisterComponent;
  let fixture: ComponentFixture<ClientRegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientRegisterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientRegisterComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
