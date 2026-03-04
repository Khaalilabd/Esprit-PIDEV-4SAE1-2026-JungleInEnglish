import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventService, Event } from '../../../core/services/event.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-events-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './events-requests.component.html'
})
export class EventsRequestsComponent implements OnInit {
  allEvents: Event[] = [];
  pendingEvents: Event[] = [];
  approvedEvents: Event[] = [];
  rejectedEvents: Event[] = [];
  
  selectedTab: 'pending' | 'approved' | 'rejected' = 'pending';
  loading = false;
  error: string | null = null;

  eventTypeIcons: { [key: string]: string } = {
    'WORKSHOP': '🛠️',
    'SEMINAR': '📚',
    'SOCIAL': '🎉'
  };

  constructor(
    private eventService: EventService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.loadEvents();
  }

  loadEvents() {
    this.loading = true;
    this.error = null;

    this.eventService.getAllEvents().subscribe({
      next: (events) => {
        this.allEvents = events;
        this.categorizeEvents();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading events:', err);
        this.error = 'Failed to load events. Please try again.';
        this.loading = false;
      }
    });
  }

  categorizeEvents() {
    this.pendingEvents = this.allEvents.filter(e => e.status === 'PENDING');
    this.approvedEvents = this.allEvents.filter(e => e.status === 'APPROVED');
    this.rejectedEvents = this.allEvents.filter(e => e.status === 'REJECTED');
  }

  approveEvent(eventId: number) {
    if (confirm('Are you sure you want to approve this event?')) {
      this.eventService.approveEvent(eventId).subscribe({
        next: () => {
          this.notificationService.success('Event Approved', 'Event has been approved successfully!');
          this.eventService.notifyEventParticipationChanged();
          this.loadEvents();
        },
        error: (err) => {
          this.notificationService.error('Approval Failed', 'Failed to approve event. Please try again.');
        }
      });
    }
  }

  rejectEvent(eventId: number) {
    if (confirm('Are you sure you want to reject this event?')) {
      this.eventService.rejectEvent(eventId).subscribe({
        next: () => {
          this.notificationService.success('Event Rejected', 'Event has been rejected successfully!');
          this.eventService.notifyEventParticipationChanged();
          this.loadEvents();
        },
        error: (err) => {
          this.notificationService.error('Rejection Failed', 'Failed to reject event. Please try again.');
        }
      });
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getEventIcon(type: string): string {
    return this.eventTypeIcons[type] || '📅';
  }
}
