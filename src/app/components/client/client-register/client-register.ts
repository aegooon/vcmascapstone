import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-client-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './client-register.html',
  styleUrl: './client-register.css'
})
export class ClientRegisterComponent {
  private readonly auth = inject(AuthService);
  showPassword = false;
  showConfirmPassword = false;
  errorMessage = '';

  formData = {
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  };

  constructor(private router: Router) {}

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onRegister(): void {
    this.errorMessage = '';

    if (!this.formData.fullName || !this.formData.email || !this.formData.password) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    if (this.formData.password !== this.formData.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    if (!this.formData.agreeToTerms) {
      this.errorMessage = 'Please agree to the Terms of Service to continue.';
      return;
    }

    this.auth.register({ fullName: this.formData.fullName, email: this.formData.email, phone: this.formData.phone, password: this.formData.password }).subscribe((success) => {
      if (success) this.router.navigate(['/client/login']);
      else this.errorMessage = this.auth.error();
    });
  }
}
