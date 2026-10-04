import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-client-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './client-register.html',
  styleUrl: './client-register.css'
})
export class ClientRegisterComponent {
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

    // TODO: replace with real registration call to DRF (POST /api/client/auth/register/)
    console.log('Registering client account:', this.formData);

    // On success, send them to login to sign in with their new credentials
    this.router.navigate(['/client/login']);
  }
}
