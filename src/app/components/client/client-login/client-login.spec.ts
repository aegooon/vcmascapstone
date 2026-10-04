import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientLoginComponent } from './client-login';

describe('ClientLoginComponent', () => {
  let component: ClientLoginComponent;
  let fixture: ComponentFixture<ClientLoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientLoginComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientLoginComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
