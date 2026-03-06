import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SessionService, UserSession } from '../../services/session.service';
import Swal from 'sweetalert2';

interface SessionSearchFilters {
  userId?: number;
  status?: string;
  deviceType?: string;
  ipAddress?: string;
  country?: string;
  suspicious?: boolean;
  startDate?: string;
  endDate?: string;
  quickFilter?: string;
}

@Component({
  selector: 'app-admin-sessions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-sessions.component.html',
  styleUrls: ['./admin-sessions.component.scss']
})
export class AdminSessionsComponent implements OnInit {
  sessions: UserSession[] = [];
  filteredSessions: UserSession[] = [];
  isLoading = false;
  
  // Statistics
  statistics: any = null;
  
  // Filters
  filters: SessionSearchFilters = {};
  availableStatuses = ['ACTIVE', 'INACTIVE', 'EXPIRED', 'TERMINATED', 'SUSPICIOUS'];
  availableDeviceTypes = ['DESKTOP', 'MOBILE', 'TABLET', 'UNKNOWN'];
  quickFilters = [
    { value: 'TODAY', label: 'Today' },
    { value: 'YESTERDAY', label: 'Yesterday' },
    { value: 'LAST_WEEK', label: 'Last Week' },
    { value: 'LAST_MONTH', label: 'Last Month' },
    { value: 'ACTIVE_ONLY', label: 'Active Only' },
    { value: 'SUSPICIOUS_ONLY', label: 'Suspicious Only' }
  ];
  
  // Pagination
  currentPage = 0;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;
  
  // View mode
  viewMode: 'grid' | 'list' = 'list';
  
  // Selected sessions for bulk actions
  selectedSessions: Set<number> = new Set();
  
  // Expose Math to template
  Math = Math;

  constructor(private sessionService: SessionService) {}

  ngOnInit() {
    this.loadStatistics();
    this.loadSessions();
  }

  loadStatistics() {
    this.sessionService.getSessionStatistics(30).subscribe({
      next: (stats) => {
        this.statistics = stats;
      },
      error: (error) => {
        console.error('Failed to load statistics:', error);
      }
    });
  }

  loadSessions() {
    this.isLoading = true;
    
    // For now, we'll use the user's own sessions endpoint
    // In production, you'd call the admin search endpoint
    this.sessionService.getMyActiveSessions().subscribe({
      next: (sessions) => {
        this.sessions = sessions;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load sessions:', error);
        this.isLoading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load sessions',
          confirmButtonColor: '#3b82f6'
        });
      }
    });
  }

  applyFilters() {
    let filtered = [...this.sessions];

    // Apply status filter
    if (this.filters.status) {
      filtered = filtered.filter(s => s.status === this.filters.status);
    }

    // Apply device type filter
    if (this.filters.deviceType) {
      filtered = filtered.filter(s => s.deviceType === this.filters.deviceType);
    }

    // Apply suspicious filter
    if (this.filters.suspicious !== undefined) {
      filtered = filtered.filter(s => s.suspicious === this.filters.suspicious);
    }

    // Apply IP filter
    if (this.filters.ipAddress) {
      filtered = filtered.filter(s => 
        s.ipAddress.toLowerCase().includes(this.filters.ipAddress!.toLowerCase())
      );
    }

    // Apply country filter
    if (this.filters.country) {
      filtered = filtered.filter(s => 
        s.country?.toLowerCase().includes(this.filters.country!.toLowerCase())
      );
    }

    this.filteredSessions = filtered;
    this.totalElements = filtered.length;
    this.totalPages = Math.ceil(this.totalElements / this.pageSize);
  }

  applyQuickFilter(filter: string) {
    this.filters.quickFilter = filter;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filter) {
      case 'TODAY':
        this.filters.startDate = today.toISOString();
        this.filters.endDate = now.toISOString();
        break;
      case 'YESTERDAY':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        this.filters.startDate = yesterday.toISOString();
        this.filters.endDate = today.toISOString();
        break;
      case 'LAST_WEEK':
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        this.filters.startDate = lastWeek.toISOString();
        this.filters.endDate = now.toISOString();
        break;
      case 'LAST_MONTH':
        const lastMonth = new Date(today);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        this.filters.startDate = lastMonth.toISOString();
        this.filters.endDate = now.toISOString();
        break;
      case 'ACTIVE_ONLY':
        this.filters.status = 'ACTIVE';
        break;
      case 'SUSPICIOUS_ONLY':
        this.filters.suspicious = true;
        break;
    }
    
    this.applyFilters();
  }

  clearFilters() {
    this.filters = {};
    this.applyFilters();
  }

  terminateSession(session: UserSession) {
    Swal.fire({
      title: 'Terminate Session?',
      html: `
        <div class="text-left">
          <p class="mb-2">User: <strong>${session.userName || session.userEmail || 'Unknown'}</strong></p>
          <p class="mb-2">Device: <strong>${session.browserName} on ${session.operatingSystem}</strong></p>
          <p class="mb-2">Location: <strong>${this.formatLocation(session)}</strong></p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, terminate',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.sessionService.terminateSession(session.id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Session Terminated',
              text: 'The session has been terminated successfully',
              confirmButtonColor: '#3b82f6',
              timer: 2000
            });
            this.loadSessions();
            this.loadStatistics();
          },
          error: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: error.error?.message || 'Failed to terminate session',
              confirmButtonColor: '#3b82f6'
            });
          }
        });
      }
    });
  }

  toggleSessionSelection(sessionId: number) {
    if (this.selectedSessions.has(sessionId)) {
      this.selectedSessions.delete(sessionId);
    } else {
      this.selectedSessions.add(sessionId);
    }
  }

  selectAll() {
    if (this.selectedSessions.size === this.filteredSessions.length) {
      this.selectedSessions.clear();
    } else {
      this.filteredSessions.forEach(s => this.selectedSessions.add(s.id));
    }
  }

  bulkTerminate() {
    if (this.selectedSessions.size === 0) return;

    Swal.fire({
      title: 'Terminate Selected Sessions?',
      text: `You are about to terminate ${this.selectedSessions.size} session(s)`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, terminate all',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const promises = Array.from(this.selectedSessions).map(id =>
          this.sessionService.terminateSession(id).toPromise()
        );

        Promise.all(promises).then(() => {
          Swal.fire({
            icon: 'success',
            title: 'Sessions Terminated',
            text: `${this.selectedSessions.size} session(s) terminated successfully`,
            confirmButtonColor: '#3b82f6',
            timer: 2000
          });
          this.selectedSessions.clear();
          this.loadSessions();
          this.loadStatistics();
        }).catch((error) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Some sessions failed to terminate',
            confirmButtonColor: '#3b82f6'
          });
        });
      }
    });
  }

  exportSessions() {
    const csv = this.convertToCSV(this.filteredSessions);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sessions-export-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  convertToCSV(sessions: UserSession[]): string {
    const headers = ['ID', 'User', 'Device', 'Browser', 'OS', 'IP', 'Location', 'Status', 'Created', 'Last Activity'];
    const rows = sessions.map(s => [
      s.id,
      s.userName || s.userEmail || 'Unknown',
      s.deviceType,
      s.browserName,
      s.operatingSystem,
      s.ipAddress,
      this.formatLocation(s),
      s.status,
      s.createdAt,
      s.lastActivity
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  getDeviceIcon(deviceType: string): string {
    return this.sessionService.getDeviceIcon(deviceType);
  }

  getBrowserIcon(browserName: string): string {
    return this.sessionService.getBrowserIcon(browserName);
  }

  getOSIcon(os: string): string {
    return this.sessionService.getOSIcon(os);
  }

  formatLocation(session: UserSession): string {
    return this.sessionService.formatLocation(session);
  }

  getStatusColor(status: string): string {
    return this.sessionService.getStatusColor(status);
  }

  getStatusBadgeClass(status: string): string {
    const colors: any = {
      'ACTIVE': 'bg-green-100 text-green-700',
      'INACTIVE': 'bg-gray-100 text-gray-700',
      'EXPIRED': 'bg-orange-100 text-orange-700',
      'TERMINATED': 'bg-red-100 text-red-700',
      'SUSPICIOUS': 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  }

  getPaginatedSessions(): UserSession[] {
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredSessions.slice(start, end);
  }

  nextPage() {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
    }
  }

  previousPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
    }
  }

  goToPage(page: number) {
    this.currentPage = page;
  }
}
