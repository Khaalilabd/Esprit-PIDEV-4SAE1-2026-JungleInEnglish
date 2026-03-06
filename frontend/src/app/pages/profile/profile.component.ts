import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { AuthResponse } from '../../core/models/user.model';
import Swal from 'sweetalert2';

@Component({
  standalone: true,
  selector: 'app-profile',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  currentUser: AuthResponse | null = null;
  profileForm!: FormGroup;
  isEditing = false;
  isLoading = false;
  profilePhotoPreview: string | null = null;
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.currentUserValue;
    
    if (this.currentUser) {
      this.loadUserProfile();
    }
    
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.initializeForm();
      }
    });
    
    this.initializeForm();
  }

  loadUserProfile() {
    if (!this.currentUser) return;
    
    this.http.get<any>(`http://localhost:8080/api/users/${this.currentUser.id}`).subscribe({
      next: (userData) => {
        if (this.currentUser) {
          const updatedUser: AuthResponse = {
            ...this.currentUser,
            ...userData
          };
          this.currentUser = updatedUser;
          this.authService.updateCurrentUser(updatedUser);
          this.initializeForm();
        }
      },
      error: (error) => {
        console.error('Failed to load user profile:', error);
      }
    });
  }

  initializeForm() {
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
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.initializeForm();
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profilePhotoPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  uploadProfilePhoto() {
    if (!this.selectedFile || !this.currentUser) return;
    
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    
    this.http.post<any>(`http://localhost:8080/api/users/${this.currentUser.id}/upload-photo`, formData).subscribe({
      next: (response) => {
        Swal.fire({ 
          icon: 'success', 
          title: 'Success!', 
          text: 'Profile photo updated', 
          confirmButtonColor: '#3b82f6', 
          timer: 2000 
        });
        this.profilePhotoPreview = null;
        this.selectedFile = null;
        
        if (this.currentUser) {
          const updatedUser: AuthResponse = {
            ...this.currentUser,
            profilePhoto: response.profilePhoto
          };
          this.authService.updateCurrentUser(updatedUser);
          this.loadUserProfile();
        }
        
        window.dispatchEvent(new CustomEvent('profilePhotoUpdated', { 
          detail: { profilePhoto: response.profilePhoto } 
        }));
      },
      error: (error) => {
        Swal.fire({ 
          icon: 'error', 
          title: 'Error!', 
          text: error.error?.error || 'Failed to upload photo', 
          confirmButtonColor: '#3b82f6' 
        });
      }
    });
  }

  onSubmit() {
    if (this.profileForm.invalid) {
      Object.keys(this.profileForm.controls).forEach(key => 
        this.profileForm.get(key)?.markAsTouched()
      );
      return;
    }
    
    this.isLoading = true;
    this.authService.updateProfile(this.profileForm.getRawValue()).subscribe({
      next: () => {
        this.isLoading = false;
        this.isEditing = false;
        Swal.fire({ 
          icon: 'success', 
          title: 'Success!', 
          text: 'Profile updated successfully', 
          confirmButtonColor: '#3b82f6', 
          timer: 2000 
        });
        this.loadUserProfile();
      },
      error: (error) => {
        this.isLoading = false;
        Swal.fire({ 
          icon: 'error', 
          title: 'Error!', 
          text: error.error?.message || 'Failed to update profile', 
          confirmButtonColor: '#3b82f6' 
        });
      }
    });
  }

  getProfilePhotoUrl(): string {
    if (this.profilePhotoPreview) return this.profilePhotoPreview;
    if (this.currentUser?.profilePhoto) {
      if (this.currentUser.profilePhoto.startsWith('http')) 
        return this.currentUser.profilePhoto;
      return `http://localhost:8081${this.currentUser.profilePhoto}`;
    }
    const name = `${this.currentUser?.firstName || 'User'}+${this.currentUser?.lastName || 'Name'}`;
    return `https://ui-avatars.com/api/?name=${name}&background=3b82f6&color=fff&size=256`;
  }

  getFieldError(fieldName: string): string {
    const field = this.profileForm.get(fieldName);
    if (field?.hasError('required')) return 'This field is required';
    if (field?.hasError('minlength')) 
      return `Minimum ${field.errors?.['minlength'].requiredLength} characters`;
    if (field?.hasError('maxlength')) 
      return `Maximum ${field.errors?.['maxlength'].requiredLength} characters`;
    return '';
  }
}
