import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-client-login',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './client-login.html',
  styleUrl: './client-login.css'
})
export class ClientLoginComponent {
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  showPassword = false;
  email = '';
  password = '';

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSignIn(): void {
    this.auth.login(this.email, this.password).subscribe((user) => {
      if (user?.role === 'client') this.router.navigate(['/client/dashboard']);
    });
  }
}
