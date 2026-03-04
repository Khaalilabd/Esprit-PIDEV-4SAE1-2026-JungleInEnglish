import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PackService } from '../../core/services/pack.service';
import { CourseCategoryService } from '../../core/services/course-category.service';
import { EventService, Event as ClubEvent } from '../../core/services/event.service';
import { Pack, PackStatus } from '../../core/models/pack.model';
import { CourseCategory } from '../../core/models/course-category.model';
import { FrontofficeUserDropdownComponent } from '../../shared/components/frontoffice-user-dropdown.component';
import { FrontofficeNotificationDropdownComponent } from '../../shared/components/frontoffice-notification-dropdown.component';
import { map } from 'rxjs/operators';

declare var $: any;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FrontofficeUserDropdownComponent, FrontofficeNotificationDropdownComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, AfterViewInit {
  mobileMenuOpen = false;
  isAuthenticated$;
  currentUser$;
  
  packs: Pack[] = [];
  categories: CourseCategory[] = [];
  selectedCategory: string = '';
  loading = false;
  
  // Events
  upcomingEvents: ClubEvent[] = [];
  loadingEvents = false;
  
  constructor(
    public authService: AuthService,
    private packService: PackService,
    private categoryService: CourseCategoryService,
    private eventService: EventService
  ) {
    this.isAuthenticated$ = this.authService.currentUser$.pipe(
      map(user => !!user)
    );
    this.currentUser$ = this.authService.currentUser$;
  }

  get userPanelLabel(): string {
    const user = this.authService.currentUserValue;
    if (user?.role === 'TUTOR') {
      return 'Tutor Panel';
    }
    return 'User Panel';
  }

  get userPanelRoute(): string {
    const user = this.authService.currentUserValue;
    if (user?.role === 'TUTOR') {
      return '/tutor-panel';
    }
    return '/user-panel';
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }
  
  ngOnInit() {
    // Cacher le preloader après le chargement
    setTimeout(() => {
      const preloader = document.querySelector('.js-preloader');
      if (preloader) {
        preloader.classList.add('loaded');
      }
    }, 500);
    
    // Charger les catégories et les packs
    this.loadCategories();
    this.loadPacks();
    this.loadUpcomingEvents();
  }

  ngAfterViewInit() {
    // Initialiser les scripts jQuery après le chargement de la vue
    if (typeof $ !== 'undefined') {
      // Réinitialiser les carousels et autres plugins
      setTimeout(() => {
        if ($('.owl-banner').length) {
          $('.owl-banner').owlCarousel({
            items: 1,
            loop: true,
            dots: true,
            nav: false,
            autoplay: true,
            autoplayTimeout: 5000,
            autoplayHoverPause: true
          });
        }
        
        if ($('.owl-testimonials').length) {
          $('.owl-testimonials').owlCarousel({
            items: 1,
            loop: true,
            dots: true,
            nav: false,
            autoplay: true,
            autoplayTimeout: 5000
          });
        }
      }, 100);
    }
  }

  loadCategories(): void {
    this.categoryService.getActiveCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  loadPacks(): void {
    this.loading = true;
    this.packService.getAvailablePacks().subscribe({
      next: (packs) => {
        this.packs = packs.filter(p => p.status === PackStatus.ACTIVE);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading packs:', error);
        this.loading = false;
      }
    });
  }

  filterByCategory(categoryName: string): void {
    this.selectedCategory = categoryName;
    
    if (!categoryName) {
      this.loadPacks();
      return;
    }
    
    this.loading = true;
    this.packService.getAvailablePacks().subscribe({
      next: (packs) => {
        this.packs = packs.filter(p => 
          p.status === PackStatus.ACTIVE && 
          p.category === categoryName
        );
        this.loading = false;
      },
      error: (error) => {
        console.error('Error filtering packs:', error);
        this.loading = false;
      }
    });
  }

  getCategoryIcon(categoryName: string): string {
    const category = this.categories.find(c => c.name === categoryName);
    return category?.icon || '📚';
  }

  getCategoryColor(categoryName: string): string {
    const category = this.categories.find(c => c.name === categoryName);
    return category?.color || '#3B82F6';
  }

  getPackCountByCategory(categoryName: string): number {
    // Count packs for a specific category from all loaded packs
    return this.packs.filter(p => p.category === categoryName).length;
  }

  getEnrollmentPercentage(pack: Pack): number {
    if (!pack.maxStudents || pack.maxStudents === 0) return 0;
    const enrolled = pack.maxStudents - (pack.availableSlots || 0);
    return Math.round((enrolled / pack.maxStudents) * 100);
  }

  loadUpcomingEvents(): void {
    this.loadingEvents = true;
    this.eventService.getAllEvents().subscribe({
      next: (events: ClubEvent[]) => {
        // Filter approved and upcoming events
        const now = new Date();
        this.upcomingEvents = events
          .filter((event: ClubEvent) => {
            // Only show approved events
            if (event.status !== 'APPROVED') return false;
            
            // Only show upcoming events (events that haven't ended yet)
            const endDate = event.endDate ? new Date(event.endDate) : new Date(event.startDate);
            return endDate >= now;
          })
          .sort((a: ClubEvent, b: ClubEvent) => {
            const dateA = new Date(a.startDate);
            const dateB = new Date(b.startDate);
            return dateA.getTime() - dateB.getTime();
          })
          .slice(0, 3); // Show only 3 upcoming events
        this.loadingEvents = false;
      },
      error: (error: any) => {
        console.error('Error loading events:', error);
        this.loadingEvents = false;
      }
    });
  }

  formatEventDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  }

  getEventDuration(event: ClubEvent): string {
    if (!event.endDate) return 'TBD';
    
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      const diffMinutes = Math.round(diffMs / (1000 * 60));
      return `${diffMinutes} Minutes`;
    }
    
    return `${diffHours} Hour${diffHours > 1 ? 's' : ''}`;
  }

  getEventTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'WORKSHOP': 'Workshop',
      'SEMINAR': 'Seminar',
      'SOCIAL': 'Social Event',
      'COMPETITION': 'Competition',
      'CONFERENCE': 'Conference'
    };
    return labels[type] || type;
  }
}
