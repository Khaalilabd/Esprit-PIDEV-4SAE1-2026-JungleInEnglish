import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LogoComponent } from '../../shared/components/logo.component';
import { RecaptchaModule, RecaptchaFormsModule } from 'ng-recaptcha';
import { PhoneInputComponent } from '../../shared/components/phone-input/phone-input.component';
import { CustomValidators } from '../../shared/validators/custom-validators';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LogoComponent, RecaptchaModule, RecaptchaFormsModule, PhoneInputComponent],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  errorMessage = '';
  validationErrors: {field: string, message: string}[] = [];
  currentStep = 1;
  totalSteps = 3;
  profilePhotoPreview: string | null = null;
  recaptchaToken: string | null = null;
  siteKey = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'; // Google test key
  showPassword = false;
  showConfirmPassword = false;
  maxDate: string;

  englishLevels = [
    { value: 'A1', label: 'A1 - Beginner' },
    { value: 'A2', label: 'A2 - Elementary' },
    { value: 'B1', label: 'B1 - Intermediate' },
    { value: 'B2', label: 'B2 - Upper Intermediate' },
    { value: 'C1', label: 'C1 - Advanced' },
    { value: 'C2', label: 'C2 - Proficient' }
  ];
  experienceYears = Array.from({length: 31}, (_, i) => i); // 0-30 years

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    // Set max date to today (for date of birth)
    const today = new Date();
    this.maxDate = today.toISOString().split('T')[0];
    
    this.registerForm = this.fb.group({
      // Step 1: Basic Info
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), CustomValidators.strongPasswordValidator()]],
      confirmPassword: ['', Validators.required],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      role: ['STUDENT', Validators.required], // Always STUDENT for public registration
      
      // Step 2: Personal Details
      phone: ['', CustomValidators.phoneValidator()],
      cin: ['', [Validators.required, CustomValidators.cinValidator(), Validators.minLength(5), Validators.maxLength(20)]],
      dateOfBirth: ['', [Validators.required, CustomValidators.minAgeValidator(13)]],
      address: [''],
      city: [''],
      postalCode: ['', CustomValidators.postalCodeValidator()],
      
      // Step 3: Profile & Experience
      bio: ['', Validators.maxLength(500)],
      englishLevel: ['', Validators.required], // Required for students
      yearsOfExperience: [null]
    }, {
      validators: CustomValidators.passwordMatchValidator('password', 'confirmPassword')
    });
  }

  selectRole(role: string): void {
    // Only STUDENT role is allowed for public registration
    this.registerForm.patchValue({ role: 'STUDENT' });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profilePhotoPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  nextStep(): void {
    // Mark all fields in current step as touched to show errors
    if (this.currentStep === 1) {
      this.firstName?.markAsTouched();
      this.lastName?.markAsTouched();
      this.email?.markAsTouched();
      this.password?.markAsTouched();
      this.confirmPassword?.markAsTouched();
    } else if (this.currentStep === 2) {
      this.cin?.markAsTouched();
      this.dateOfBirth?.markAsTouched();
    } else if (this.currentStep === 3) {
      this.englishLevel?.markAsTouched();
    }
    
    if (this.currentStep < this.totalSteps && this.isStepValid(this.currentStep)) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number): void {
    // Allow navigation to completed steps or next step if current is valid
    if (step <= this.currentStep || (step === this.currentStep + 1 && this.isStepValid(this.currentStep))) {
      this.currentStep = step;
    }
  }

  isStepValid(step: number): boolean {
    switch(step) {
      case 1:
        return !!(this.email?.valid && this.password?.valid && this.confirmPassword?.valid &&
                 this.firstName?.valid && this.lastName?.valid);
      case 2:
        return !!(this.cin?.valid && this.dateOfBirth?.valid);
      case 3:
        return !!(this.englishLevel?.valid && this.recaptchaToken); // Require reCAPTCHA
      default:
        return false;
    }
  }

  onCaptchaResolved(token: string | null): void {
    this.recaptchaToken = token;
    console.log('reCAPTCHA resolved:', token);
  }

  onSubmit(): void {
    if (this.registerForm.invalid || !this.recaptchaToken) {
      this.errorMessage = 'Please complete the reCAPTCHA verification';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.validationErrors = [];

    // Add recaptcha token to form data
    const formData = {
      ...this.registerForm.value,
      recaptchaToken: this.recaptchaToken
    };

    this.authService.register(formData).subscribe({
      next: (response) => {
        console.log('Registration successful:', response);
        
        // Rediriger vers la page HTML backend avec animation (via API Gateway)
        if (this.registerForm.get('role')?.value === 'STUDENT') {
          window.location.href = `http://localhost:8088/activation-pending?email=${encodeURIComponent(this.registerForm.get('email')?.value)}&firstName=${encodeURIComponent(this.registerForm.get('firstName')?.value)}`;
        } else {
          // Pour TUTOR/ACADEMIC: rediriger vers la page Angular statique (activation par admin)
          this.router.navigate(['/activation-pending'], {
            queryParams: {
              email: this.registerForm.get('email')?.value,
              firstName: this.registerForm.get('firstName')?.value,
              type: 'admin'
            }
          });
        }
      },
      error: (error) => {
        console.error('Registration error:', error);
        
        // Extraire les erreurs de validation du backend
        if (error.error?.validationErrors && Array.isArray(error.error.validationErrors)) {
          this.validationErrors = error.error.validationErrors.map((err: any) => ({
            field: err.field,
            message: err.message
          }));
          this.errorMessage = 'Please fix the validation errors below';
        } else {
          this.errorMessage = error.error?.message || 'An error occurred during registration';
          this.validationErrors = [];
        }
        
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
  get firstName() { return this.registerForm.get('firstName'); }
  get lastName() { return this.registerForm.get('lastName'); }
  get role() { return this.registerForm.get('role'); }
  get phone() { return this.registerForm.get('phone'); }
  get cin() { return this.registerForm.get('cin'); }
  get dateOfBirth() { return this.registerForm.get('dateOfBirth'); }
  get address() { return this.registerForm.get('address'); }
  get city() { return this.registerForm.get('city'); }
  get postalCode() { return this.registerForm.get('postalCode'); }
  get bio() { return this.registerForm.get('bio'); }
  get englishLevel() { return this.registerForm.get('englishLevel'); }
  get yearsOfExperience() { return this.registerForm.get('yearsOfExperience'); }
  
  // Helper methods for password strength display
  get passwordStrength(): string {
    const password = this.password?.value || '';
    if (password.length === 0) return '';
    if (password.length < 8) return 'weak';
    
    let strength = 0;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    if (strength <= 2) return 'weak';
    if (strength === 3) return 'medium';
    return 'strong';
  }
  
  getStepErrors(): string[] {
    const errors: string[] = [];
    
    if (this.currentStep === 1) {
      if (this.firstName?.invalid && this.firstName?.touched) {
        errors.push('First name is required (min 2 characters)');
      }
      if (this.lastName?.invalid && this.lastName?.touched) {
        errors.push('Last name is required (min 2 characters)');
      }
      if (this.email?.invalid && this.email?.touched) {
        if (this.email?.errors?.['required']) errors.push('Email is required');
        if (this.email?.errors?.['email']) errors.push('Invalid email format');
      }
      if (this.password?.invalid && this.password?.touched) {
        if (this.password?.errors?.['required']) errors.push('Password is required');
        if (this.password?.errors?.['minlength']) errors.push('Password must be at least 8 characters');
        if (this.password?.errors?.['weakPassword']) errors.push('Password must contain uppercase, lowercase, and numbers');
      }
      if (this.confirmPassword?.invalid && this.confirmPassword?.touched) {
        if (this.confirmPassword?.errors?.['required']) errors.push('Please confirm your password');
        if (this.confirmPassword?.errors?.['passwordMismatch']) errors.push('Passwords do not match');
      }
    } else if (this.currentStep === 2) {
      if (this.cin?.invalid && this.cin?.touched) {
        if (this.cin?.errors?.['required']) errors.push('CIN is required');
        if (this.cin?.errors?.['invalidCin']) errors.push('CIN must contain only numbers');
        if (this.cin?.errors?.['minlength']) errors.push('CIN must be at least 5 digits');
      }
      if (this.dateOfBirth?.invalid && this.dateOfBirth?.touched) {
        if (this.dateOfBirth?.errors?.['required']) errors.push('Date of birth is required');
        if (this.dateOfBirth?.errors?.['minAge']) errors.push('You must be at least 13 years old');
      }
    } else if (this.currentStep === 3) {
      if (this.englishLevel?.invalid && this.englishLevel?.touched) {
        errors.push('Please select your English level');
      }
      if (!this.recaptchaToken) {
        errors.push('Please complete the reCAPTCHA verification');
      }
    }
    
    return errors;
  }
}
