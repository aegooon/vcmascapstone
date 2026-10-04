import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-client-login',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './client-login.html',
  styleUrl: './client-login.css'
})
export class ClientLoginComponent {
  showPassword = false;

  constructor(private router: Router) {}

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSignIn(): void {
    // TODO: replace with real auth call to DRF (POST /api/client/auth/login/)
    this.router.navigate(['/client/dashboard']);
  }
}
