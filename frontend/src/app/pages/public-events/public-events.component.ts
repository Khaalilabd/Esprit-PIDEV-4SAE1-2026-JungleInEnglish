import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EventService, Event } from '../../core/services/event.service';
import { AuthService } from '../../core/services/auth.service';
import { FrontofficeUserDropdownComponent } from '../../shared/components/frontoffice-user-dropdown.component';
import { FrontofficeNotificationDropdownComponent } from '../../shared/components/frontoffice-notification-dropdown.component';
import { EventSliderComponent, SlideData } from '../../shared/components/event-slider/event-slider.component';

@Component({
  selector: 'app-public-events',
  standalone: true,
  imports: [CommonModule, RouterModule, FrontofficeUserDropdownComponent, FrontofficeNotificationDropdownComponent, EventSliderComponent],
  templateUrl: './public-events.component.html',
  styleUrl: './public-events.component.scss',
  host: {
    '(document:click)': 'onDocumentClick($event)',
  }
})
export class PublicEventsComponent implements OnInit {
  allEvents: Event[] = [];
  filteredEvents: Event[] = [];
  loading = false;
  error: string | null = null;
  eventTypes = ['WORKSHOP', 'SEMINAR', 'SOCIAL'];
  selectedType: string | null = null;
  mobileMenuOpen = false;
  selectedEvent: Event | null = null;
  showDetailsModal = false;
  dropdownOpen = false;
  selectedGalleryImage: string | null = null;

  // Slider data
  sliderData: SlideData[] = [
    { 
      title: 'Workshops', 
      image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&h=800&fit=crop',
      icon: '🛠️'
    },
    { 
      title: 'Seminars', 
      image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1200&h=800&fit=crop',
      icon: '📚'
    },
    { 
      title: 'Social Events', 
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&h=800&fit=crop',
      icon: '🎉'
    }
  ];

  constructor(
    private eventService: EventService,
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
    this.loadEvents();
  }

  loadEvents() {
    this.loading = true;
    this.error = null;

    this.eventService.getAllEvents().subscribe({
      next: (events) => {
        console.log('All events received:', events);
        // Afficher tous les événements (ne pas filtrer par statut pour le moment)
        this.allEvents = events;
        this.filteredEvents = this.allEvents;
        this.loading = false;
        console.log('Events to display:', this.filteredEvents);
      },
      error: (err) => {
        console.error('Error loading events:', err);
        this.error = 'Impossible de charger les événements. Veuillez réessayer.';
        this.loading = false;
      }
    });
  }

  filterByType(type: string | null) {
    this.selectedType = type;
    this.dropdownOpen = false;
    
    if (type === null) {
      this.filteredEvents = this.allEvents;
    } else {
      this.filteredEvents = this.allEvents.filter(event => event.type === type);
    }
  }

  getTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'WORKSHOP': '🛠️',
      'SEMINAR': '🎓',
      'SOCIAL': '🎉'
    };
    return icons[type] || '📅';
  }

  getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'WORKSHOP': 'Workshop',
      'SEMINAR': 'Seminar',
      'SOCIAL': 'Social Event'
    };
    return labels[type] || type;
  }

  showEventDetails(event: Event) {
    this.selectedEvent = event;
    this.showDetailsModal = true;
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedEvent = null;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  isEventFull(event: Event): boolean {
    return (event.currentParticipants || 0) >= event.maxParticipants;
  }

  openGalleryImage(image: string) {
    this.selectedGalleryImage = image;
  }

  closeGalleryImage() {
    this.selectedGalleryImage = null;
  }
}
