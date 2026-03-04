import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ClubService } from '../../core/services/club.service';
import { AuthService } from '../../core/services/auth.service';
import { Club, ClubCategory } from '../../core/models/club.model';
import { FrontofficeUserDropdownComponent } from '../../shared/components/frontoffice-user-dropdown.component';
import { FrontofficeNotificationDropdownComponent } from '../../shared/components/frontoffice-notification-dropdown.component';

@Component({
  selector: 'app-public-clubs',
  standalone: true,
  imports: [CommonModule, RouterModule, FrontofficeUserDropdownComponent, FrontofficeNotificationDropdownComponent],
  templateUrl: './public-clubs.component.html',
  styleUrls: ['./public-clubs.component.scss'],
  host: {
    '(document:click)': 'onDocumentClick($event)',
  }
})
export class PublicClubsComponent implements OnInit {
  allClubs: Club[] = [];
  filteredClubs: Club[] = [];
  loading = false;
  error: string | null = null;
  categories = Object.values(ClubCategory);
  selectedCategory: ClubCategory | null = null;
  mobileMenuOpen = false;
  selectedClub: Club | null = null;
  showDetailsModal = false;
  dropdownOpen = false;

  constructor(
    private clubService: ClubService,
    public authService: AuthService
  ) {}

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.filter-dropdown-container')) {
      this.dropdownOpen = false;
    }
  }

  ngOnInit() {
    this.loadClubs();
  }

  loadClubs() {
    this.loading = true;
    this.error = null;

    this.clubService.getAllClubs().subscribe({
      next: (clubs) => {
        // Ne pas filtrer les clubs suspendus, les afficher tous
        this.allClubs = clubs;
        this.filteredClubs = clubs;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading clubs:', err);
        this.error = 'Failed to load clubs. Please try again.';
        this.loading = false;
      }
    });
  }

  filterByCategory(category: ClubCategory | null) {
    this.selectedCategory = category;
    this.dropdownOpen = false;
    
    if (category === null) {
      this.filteredClubs = this.allClubs;
    } else {
      this.filteredClubs = this.allClubs.filter(club => club.category === category);
    }
  }

  getCategoryBadgeClass(category: string): string {
    const classes: { [key: string]: string } = {
      'CONVERSATION': 'text-blue-800 bg-blue-100',
      'BOOK': 'text-green-800 bg-green-100',
      'DRAMA': 'text-orange-800 bg-orange-100',
      'WRITING': 'text-purple-800 bg-purple-100'
    };
    return classes[category] || 'text-gray-800 bg-gray-100';
  }

  getCategoryColorClass(category: string): string {
    const classes: { [key: string]: string } = {
      'CONVERSATION': 'bg-blue-100',
      'BOOK': 'bg-green-100',
      'DRAMA': 'bg-orange-100',
      'WRITING': 'bg-purple-100'
    };
    return classes[category] || 'bg-gray-100';
  }

  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'CONVERSATION': '💬',
      'BOOK': '📚',
      'DRAMA': '🎭',
      'WRITING': '✍️',
      'GRAMMAR': '📝',
      'VOCABULARY': '📖',
      'READING': '📰',
      'LISTENING': '🎧',
      'SPEAKING': '🗣️',
      'PRONUNCIATION': '🔊',
      'BUSINESS': '💼',
      'ACADEMIC': '🎓'
    };
    return icons[category] || '📖';
  }

  getCategoryLabel(category: string): string {
    const labels: { [key: string]: string } = {
      'CONVERSATION': 'Conversation',
      'BOOK': 'Book Club',
      'DRAMA': 'Drama',
      'WRITING': 'Writing',
      'GRAMMAR': 'Grammar',
      'VOCABULARY': 'Vocabulary',
      'READING': 'Reading',
      'LISTENING': 'Listening',
      'SPEAKING': 'Speaking',
      'PRONUNCIATION': 'Pronunciation',
      'BUSINESS': 'Business English',
      'ACADEMIC': 'Academic English'
    };
    return labels[category] || category;
  }

  showClubDetails(club: Club) {
    this.selectedClub = club;
    this.showDetailsModal = true;
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedClub = null;
  }
}
