import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CustomValidators } from '../../shared/validators/custom-validators';

@Component({
  selector: 'app-complete-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './complete-profile.component.html',
  styleUrls: ['./complete-profile.component.scss']
})
export class CompleteProfileComponent implements OnInit {
  token: string = '';
  userId: string = '';
  email: string = '';
  firstName: string = '';
  lastName: string = '';
  profileForm!: FormGroup;
  maxDate: string;

  englishLevels = [
    { value: 'A1', label: 'A1 - Beginner' },
    { value: 'A2', label: 'A2 - Elementary' },
    { value: 'B1', label: 'B1 - Intermediate' },
    { value: 'B2', label: 'B2 - Upper Intermediate' },
    { value: 'C1', label: 'C1 - Advanced' },
    { value: 'C2', label: 'C2 - Proficient' }
  ];
  loading = false;
  error = '';
  validationErrors: {field: string, message: string}[] = [];
  success = false;

  private apiUrl = 'http://localhost:8088/api/auth'; // Via API Gateway

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    // Set max date to today
    const today = new Date();
    this.maxDate = today.toISOString().split('T')[0];
    
    this.profileForm = this.fb.group({
      phone: ['', CustomValidators.phoneValidator()],
      cin: ['', [Validators.required, CustomValidators.cinValidator(), Validators.minLength(5), Validators.maxLength(20)]],
      dateOfBirth: ['', [Validators.required, CustomValidators.minAgeValidator(13)]],
      address: [''],
      city: [''],
      postalCode: ['', CustomValidators.postalCodeValidator()],
      bio: ['', Validators.maxLength(500)],
      englishLevel: ['', Validators.required]
    });
  }

  ngOnInit() {
    // Récupérer les paramètres URL
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      this.userId = params['userId'] || '';
      this.email = params['email'] || '';
      this.firstName = params['firstName'] || '';
      this.lastName = params['lastName'] || '';

      // Stocker les données utilisateur dans le format attendu par AuthService
      if (this.token && this.userId) {
        const userData = {
          token: this.token,
          type: 'Bearer',
          id: parseInt(this.userId),
          email: this.email,
          firstName: this.firstName,
          lastName: this.lastName,
          role: 'STUDENT', // Par défaut pour les nouveaux utilisateurs
          profileCompleted: false
        };
        
        localStorage.setItem('currentUser', JSON.stringify(userData));
        localStorage.setItem('token', this.token);
      }

      // Vérifier que tous les paramètres sont présents
      if (!this.token || !this.userId) {
        this.error = 'Missing required parameters. Redirecting to login...';
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 2000);
      }
    });
  }

  onSubmit() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.error = 'Please fill in all required fields correctly';
      return;
    }

    this.loading = true;
    this.error = '';
    this.validationErrors = [];

    // Préparer les données en s'assurant que les valeurs vides sont null
    const formData: any = {};
    Object.keys(this.profileForm.value).forEach(key => {
      const value = this.profileForm.value[key];
      if (value !== null && value !== undefined && value !== '') {
        formData[key] = value;
      }
    });

    console.log('Submitting profile data:', formData);
    console.log('User ID:', this.userId);
    console.log('Token:', this.token ? 'Present' : 'Missing');

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    });

    this.http.post(
      `${this.apiUrl}/complete-profile/${this.userId}`,
      formData,
      { headers }
    ).subscribe({
      next: (response: any) => {
        console.log('Profile completed:', response);
        this.success = true;
        
        // Mettre à jour le currentUser avec profileCompleted = true
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        currentUser.profileCompleted = true;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Rediriger vers la home page après 1.5 secondes
        setTimeout(() => {
          // Recharger la page pour que le AuthService détecte l'utilisateur connecté
          window.location.href = '/';
        }, 1500);
      },
      error: (error) => {
        console.error('Error completing profile:', error);
        console.error('Error details:', error.error);
        
        // Extraire les erreurs de validation du backend
        if (error.error?.validationErrors && Array.isArray(error.error.validationErrors)) {
          this.validationErrors = error.error.validationErrors.map((err: any) => ({
            field: err.field,
            message: err.message
          }));
          this.error = 'Please fix the validation errors below';
        } else {
          this.error = error.error?.message || 'Failed to complete profile. Please try again.';
          this.validationErrors = [];
        }
        
        this.loading = false;
      }
    });
  }

  get f() {
    return this.profileForm.controls;
  }

  get bioLength(): number {
    return this.profileForm.get('bio')?.value?.length || 0;
  }
}
