import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../../core/services/notification.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-toast.component.html',
  styleUrls: ['./notification-toast.component.scss'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(400px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateX(400px)', opacity: 0 }))
      ])
    ])
  ]
})
export class NotificationToastComponent implements OnInit {
  notifications: Notification[] = [];

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.notifications$.subscribe(notifications => {
      this.notifications = notifications;
    });
  }

  removeNotification(id: string): void {
    this.notificationService.removeNotification(id);
  }

  getIcon(type: string): string {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  }

  getColorClasses(type: string): string {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-green-50 to-green-100 border-green-500 text-green-900';
      case 'error':
        return 'bg-gradient-to-r from-red-50 to-red-100 border-red-500 text-red-900';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-500 text-yellow-900';
      case 'info':
        return 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-500 text-blue-900';
      default:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-500 text-gray-900';
    }
  }

  getIconBgClasses(type: string): string {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-br from-green-500 to-green-600';
      case 'error':
        return 'bg-gradient-to-br from-red-500 to-red-600';
      case 'warning':
        return 'bg-gradient-to-br from-yellow-500 to-yellow-600';
      case 'info':
        return 'bg-gradient-to-br from-blue-500 to-blue-600';
      default:
        return 'bg-gradient-to-br from-gray-500 to-gray-600';
    }
  }
}
