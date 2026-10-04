import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  showPassword = false;
  email = '';
  password = '';

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSignIn(): void {
    this.auth.login(this.email, this.password).subscribe((user) => {
      if (user) this.router.navigate(['/dashboard']);
    });
  }
}
