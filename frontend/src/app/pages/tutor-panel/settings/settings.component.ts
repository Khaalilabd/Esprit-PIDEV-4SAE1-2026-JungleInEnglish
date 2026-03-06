import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { AuthResponse } from '../../../core/models/user.model';
import { TwoFactorAuthService, TwoFactorSetupResponse, TwoFactorStatusResponse } from '../../../services/two-factor-auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-tutor-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class TutorSettingsComponent implements OnInit {
  currentUser: AuthResponse | null = null;
  activeTab: 'profile' | 'security' | 'notifications' | 'appearance' = 'profile';
  
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  notificationForm!: FormGroup;
  
  isLoadingProfile = false;
  isLoadingPassword = false;
  isLoadingNotifications = false;
  
  profilePhotoPreview: string | null = null;
  selectedFile: File | null = null;
  isDragging = false;
  
  // Password strength
  passwordStrength: 'weak' | 'medium' | 'strong' | null = null;
  
  // Profile completion
  profileCompletion = 0;
  
  // Dark mode
  isDarkMode = false;
  
  // Active sessions (mock data for now)
  activeSessions = [
    {
      id: 1,
      device: 'Windows PC',
      browser: 'Chrome',
      location: 'Paris, France',
      ip: '192.168.1.1',
      lastActive: new Date(),
      isCurrent: true
    }
  ];

  // 2FA properties
  twoFactorStatus: TwoFactorStatusResponse | null = null;
  isLoading2FA = false;
  showSetupModal = false;
  showDisableModal = false;
  setupData: TwoFactorSetupResponse | null = null;
  verificationCode = '';
  backupCodes: string[] = [];
  showBackupCodesModal = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private http: HttpClient,
    private twoFactorService: TwoFactorAuthService
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.currentUserValue;
    
    // Load fresh user data from backend
    if (this.currentUser) {
      this.loadUserProfile();
      this.load2FAStatus();
    }
    
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.initializeForms();
      }
    });
    
    this.initializeForms();
    this.calculateProfileCompletion();
    this.loadDarkModePreference();
  }
  
  calculateProfileCompletion() {
    if (!this.currentUser) return;
    
    const fields = [
      this.currentUser.firstName,
      this.currentUser.lastName,
      this.currentUser.email,
      this.currentUser.phone,
      this.currentUser.dateOfBirth,
      this.currentUser.address,
      this.currentUser.city,
      this.currentUser.postalCode,
      this.currentUser.bio,
      this.currentUser.profilePhoto
    ];
    
    const filledFields = fields.filter(field => field && field.toString().trim() !== '').length;
    this.profileCompletion = Math.round((filledFields / fields.length) * 100);
  }
  
  loadDarkModePreference() {
    const savedMode = localStorage.getItem('darkMode');
    this.isDarkMode = savedMode === 'true';
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }
  
  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('darkMode', this.isDarkMode.toString());
    
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    Swal.fire({
      icon: 'success',
      title: 'Theme Updated!',
      text: `${this.isDarkMode ? 'Dark' : 'Light'} mode activated`,
      confirmButtonColor: '#3b82f6',
      timer: 1500,
      showConfirmButton: false
    });
  }

  loadUserProfile() {
    if (!this.currentUser) return;
    
    console.log('Loading user profile for ID:', this.currentUser.id);
    
    this.http.get<any>(`http://localhost:8080/api/users/${this.currentUser.id}`).subscribe({
      next: (userData) => {
        console.log('User data loaded from backend:', userData);
        // Update current user with fresh data
        if (this.currentUser) {
          const updatedUser: AuthResponse = {
            ...this.currentUser,
            ...userData
          };
          this.currentUser = updatedUser;
          console.log('Updated currentUser:', this.currentUser);
          
          // Update in authService to persist in localStorage
          this.authService.updateCurrentUser(updatedUser);
          
          this.initializeForms();
        }
      },
      error: (error) => {
        console.error('Failed to load user profile:', error);
      }
    });
  }

  initializeForms() {
    this.profileForm = this.fb.group({
      firstName: [this.currentUser?.firstName || '', [Validators.required, Validators.minLength(2)]],
      lastName: [this.currentUser?.lastName || '', [Validators.required, Validators.minLength(2)]],
      email: [{ value: this.currentUser?.email || '', disabled: true }],
      phone: [this.currentUser?.phone || ''],
      dateOfBirth: [this.currentUser?.dateOfBirth || ''],
      address: [this.currentUser?.address || ''],
      city: [this.currentUser?.city || ''],
      postalCode: [this.currentUser?.postalCode || ''],
      bio: [this.currentUser?.bio || '', [Validators.maxLength(500)]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
    
    // Watch password changes for strength indicator
    this.passwordForm.get('newPassword')?.valueChanges.subscribe(password => {
      this.checkPasswordStrength(password);
    });

    this.notificationForm = this.fb.group({
      emailNotifications: [true],
      pushNotifications: [true],
      complaintUpdates: [true],
      messageNotifications: [true],
      weeklyDigest: [false]
    });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value ? null : { 'mismatch': true };
  }
  
  checkPasswordStrength(password: string) {
    if (!password) {
      this.passwordStrength = null;
      return;
    }
    
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    
    // Character variety checks
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    
    if (strength <= 2) {
      this.passwordStrength = 'weak';
    } else if (strength <= 4) {
      this.passwordStrength = 'medium';
    } else {
      this.passwordStrength = 'strong';
    }
  }

  setActiveTab(tab: 'profile' | 'security' | 'notifications' | 'appearance') {
    this.activeTab = tab;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.handleFile(file);
    }
  }
  
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }
  
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }
  
  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }
  
  handleFile(file: File) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File',
        text: 'Please select an image file',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'File Too Large',
        text: 'Please select an image smaller than 5MB',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }
    
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.profilePhotoPreview = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  uploadProfilePhoto() {
    if (!this.selectedFile || !this.currentUser) return;
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    
    console.log('Uploading profile photo for user ID:', this.currentUser.id);
    
    // Use correct endpoint
    this.http.post<any>(`http://localhost:8080/api/users/${this.currentUser.id}/upload-photo`, formData).subscribe({
      next: (response) => {
        console.log('Upload response:', response);
        Swal.fire({ icon: 'success', title: 'Success!', text: 'Profile photo updated', confirmButtonColor: '#3b82f6', timer: 2000 });
        this.profilePhotoPreview = null;
        this.selectedFile = null;
        
        // Update current user with new photo and refresh from backend
        if (this.currentUser) {
          const updatedUser: AuthResponse = {
            ...this.currentUser,
            profilePhoto: response.profilePhoto
          };
          console.log('Updated photo URL:', response.profilePhoto);
          this.authService.updateCurrentUser(updatedUser);
          
          // Reload user profile to get fresh data
          this.loadUserProfile();
        }
        
        window.dispatchEvent(new CustomEvent('profilePhotoUpdated', { detail: { profilePhoto: response.profilePhoto } }));
      },
      error: (error) => {
        console.error('Upload error:', error);
        Swal.fire({ icon: 'error', title: 'Error!', text: error.error?.error || 'Failed to upload photo', confirmButtonColor: '#3b82f6' });
      }
    });
  }

  onSubmitProfile() {
    if (this.profileForm.invalid) {
      Object.keys(this.profileForm.controls).forEach(key => this.profileForm.get(key)?.markAsTouched());
      return;
    }
    this.isLoadingProfile = true;
    this.authService.updateProfile(this.profileForm.getRawValue()).subscribe({
      next: () => {
        this.isLoadingProfile = false;
        this.calculateProfileCompletion();
        Swal.fire({ icon: 'success', title: 'Success!', text: 'Profile updated', confirmButtonColor: '#3b82f6', timer: 2000 });
      },
      error: (error) => {
        this.isLoadingProfile = false;
        Swal.fire({ icon: 'error', title: 'Error!', text: error.error?.message || 'Failed to update', confirmButtonColor: '#3b82f6' });
      }
    });
  }

  onSubmitPassword() {
    if (this.passwordForm.invalid) {
      Object.keys(this.passwordForm.controls).forEach(key => this.passwordForm.get(key)?.markAsTouched());
      return;
    }
    this.isLoadingPassword = true;
    const { currentPassword, newPassword } = this.passwordForm.value;
    this.authService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.isLoadingPassword = false;
        this.passwordForm.reset();
        Swal.fire({ icon: 'success', title: 'Success!', text: 'Password changed', confirmButtonColor: '#3b82f6', timer: 2000 });
      },
      error: (error) => {
        this.isLoadingPassword = false;
        Swal.fire({ icon: 'error', title: 'Error!', text: error.error?.message || 'Failed to change password', confirmButtonColor: '#3b82f6' });
      }
    });
  }

  onSubmitNotifications() {
    this.isLoadingNotifications = true;
    setTimeout(() => {
      this.isLoadingNotifications = false;
      Swal.fire({ icon: 'success', title: 'Success!', text: 'Preferences updated', confirmButtonColor: '#3b82f6', timer: 2000 });
    }, 1000);
  }

  getProfilePhotoUrl(): string {
    if (this.profilePhotoPreview) return this.profilePhotoPreview;
    if (this.currentUser?.profilePhoto) {
      if (this.currentUser.profilePhoto.startsWith('http')) return this.currentUser.profilePhoto;
      return `http://localhost:8081${this.currentUser.profilePhoto}`;
    }
    const name = `${this.currentUser?.firstName || 'User'}+${this.currentUser?.lastName || 'Name'}`;
    return `https://ui-avatars.com/api/?name=${name}&background=3b82f6&color=fff&size=256`;
  }

  getFieldError(formGroup: FormGroup, fieldName: string): string {
    const field = formGroup.get(fieldName);
    if (field?.hasError('required')) return 'This field is required';
    if (field?.hasError('minlength')) return `Minimum ${field.errors?.['minlength'].requiredLength} characters`;
    if (field?.hasError('maxlength')) return `Maximum ${field.errors?.['maxlength'].requiredLength} characters`;
    if (field?.hasError('pattern')) return 'Invalid format';
    if (field?.hasError('email')) return 'Invalid email address';
    return '';
  }

  // ========== 2FA Methods ==========

  load2FAStatus() {
    this.twoFactorService.getTwoFactorStatus().subscribe({
      next: (status) => {
        this.twoFactorStatus = status;
      },
      error: (error) => {
        console.error('Failed to load 2FA status:', error);
      }
    });
  }

  openSetup2FA() {
    this.isLoading2FA = true;
    this.twoFactorService.setupTwoFactor().subscribe({
      next: (response) => {
        this.setupData = response;
        this.showSetupModal = true;
        this.isLoading2FA = false;
      },
      error: (error) => {
        this.isLoading2FA = false;
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: error.error?.message || 'Failed to setup 2FA',
          confirmButtonColor: '#3b82f6'
        });
      }
    });
  }

  enable2FA() {
    if (!this.verificationCode || this.verificationCode.length !== 6) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Code',
        text: 'Please enter a 6-digit code',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    this.isLoading2FA = true;
    this.twoFactorService.enableTwoFactor(this.verificationCode).subscribe({
      next: () => {
        this.isLoading2FA = false;
        this.backupCodes = this.setupData?.backupCodes || [];
        this.showSetupModal = false;
        this.showBackupCodesModal = true;
        this.verificationCode = '';
        this.load2FAStatus();
        
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: '2FA has been enabled successfully',
          confirmButtonColor: '#3b82f6',
          timer: 2000
        });
      },
      error: (error) => {
        this.isLoading2FA = false;
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: error.error?.message || 'Invalid verification code',
          confirmButtonColor: '#3b82f6'
        });
      }
    });
  }

  openDisable2FA() {
    this.showDisableModal = true;
    this.verificationCode = '';
  }

  disable2FA() {
    if (!this.verificationCode || this.verificationCode.length !== 6) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Code',
        text: 'Please enter a 6-digit code',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    this.isLoading2FA = true;
    this.twoFactorService.disableTwoFactor(this.verificationCode).subscribe({
      next: () => {
        this.isLoading2FA = false;
        this.showDisableModal = false;
        this.verificationCode = '';
        this.load2FAStatus();
        
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: '2FA has been disabled',
          confirmButtonColor: '#3b82f6',
          timer: 2000
        });
      },
      error: (error) => {
        this.isLoading2FA = false;
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: error.error?.message || 'Invalid verification code',
          confirmButtonColor: '#3b82f6'
        });
      }
    });
  }

  regenerateBackupCodes() {
    Swal.fire({
      title: 'Regenerate Backup Codes?',
      text: 'This will invalidate all existing backup codes',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, regenerate'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading2FA = true;
        this.twoFactorService.regenerateBackupCodes().subscribe({
          next: (codes) => {
            this.isLoading2FA = false;
            this.backupCodes = codes;
            this.showBackupCodesModal = true;
            this.load2FAStatus();
            
            Swal.fire({
              icon: 'success',
              title: 'Success!',
              text: 'New backup codes generated',
              confirmButtonColor: '#3b82f6',
              timer: 2000
            });
          },
          error: (error) => {
            this.isLoading2FA = false;
            Swal.fire({
              icon: 'error',
              title: 'Error!',
              text: error.error?.message || 'Failed to regenerate codes',
              confirmButtonColor: '#3b82f6'
            });
          }
        });
      }
    });
  }

  downloadBackupCodes() {
    const text = this.backupCodes.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'englishflow-backup-codes.txt';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  closeSetupModal() {
    this.showSetupModal = false;
    this.verificationCode = '';
    this.setupData = null;
  }

  closeDisableModal() {
    this.showDisableModal = false;
    this.verificationCode = '';
  }

  closeBackupCodesModal() {
    this.showBackupCodesModal = false;
    this.backupCodes = [];
  }
}
