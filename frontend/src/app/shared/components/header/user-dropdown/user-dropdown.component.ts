import { Component } from '@angular/core';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DropdownItemTwoComponent } from '../../ui/dropdown/dropdown-item/dropdown-item.component-two';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthResponse } from '../../../../core/models/user.model';
import { UserRoleBadgeComponent } from '../../user-role-badge/user-role-badge.component';

@Component({
  standalone: true,
  selector: 'app-user-dropdown',
  templateUrl: './user-dropdown.component.html',
  imports:[CommonModule, RouterModule, DropdownComponent, DropdownItemTwoComponent, UserRoleBadgeComponent]
})
export class UserDropdownComponent {
  isOpen = false;
  currentUser: AuthResponse | null = null;

  constructor(private authService: AuthService) {
    this.currentUser = this.authService.currentUserValue;
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  getProfilePhotoUrl(): string {
    if (this.currentUser?.profilePhoto) {
      // If URL starts with http, return as is (external URL like Google profile)
      if (this.currentUser.profilePhoto.startsWith('http')) {
        return this.currentUser.profilePhoto;
      }
      // Otherwise, add backend prefix for local uploads
      return `http://localhost:8081${this.currentUser.profilePhoto}`;
    }
    // Default avatar if no photo
    const name = `${this.currentUser?.firstName || 'User'}+${this.currentUser?.lastName || 'Name'}`;
    return `https://ui-avatars.com/api/?name=${name}&background=F6BD60&color=fff&size=128`;
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  closeDropdown() {
    this.isOpen = false;
  }

  logout() {
    this.authService.logout().subscribe({
      complete: () => {
        window.location.href = '/';
      }
    });
  }

  getLevelDescription(): string {
    const levelName = this.currentUser?.gamificationLevel?.assessmentLevelName;
    if (!levelName) return 'Level';
    const parts = levelName.split(' - ');
    return parts.length > 1 ? parts[1] : 'Level';
  }

  getSettingsRoute(): string {
    const role = this.currentUser?.role;
    switch (role) {
      case 'STUDENT':
        return '/user-panel/settings';
      case 'TUTOR':
      case 'TEACHER':
        return '/tutor-panel/settings';
      case 'ADMIN':
      case 'ACADEMIC_OFFICE_AFFAIR':
        return '/dashboard/settings';
      default:
        return '/dashboard/settings';
    }
  }

  getProfileRoute(): string {
    const role = this.currentUser?.role;
    switch (role) {
      case 'STUDENT':
        return '/user-panel/settings';
      case 'TUTOR':
      case 'TEACHER':
        return '/tutor-panel/profile';
      case 'ADMIN':
      case 'ACADEMIC_OFFICE_AFFAIR':
        return '/dashboard/profile';
      default:
        return '/dashboard/profile';
    }
  }
}