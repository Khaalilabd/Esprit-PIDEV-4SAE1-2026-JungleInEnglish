import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OpenStreetMapProvider } from 'leaflet-geosearch';
import { debounceTime, Subject } from 'rxjs';

export interface LocationData {
  address: string;
  latitude: number;
  longitude: number;
}

@Component({
  selector: 'app-location-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="w-full">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {{ label }}
        <span *ngIf="required" class="text-red-500">*</span>
      </label>
      <div class="relative">
        <input
          type="text"
          [(ngModel)]="searchValue"
          (ngModelChange)="onSearchChange($event)"
          [placeholder]="placeholder"
          class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          [class.border-red-500]="error"
          (focus)="showSuggestions = true"
        />
        <div *ngIf="searching" class="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
        </div>
        <div *ngIf="selectedLocation && !searching" class="absolute right-3 top-1/2 transform -translate-y-1/2">
          <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
      
      <!-- Suggestions dropdown -->
      <div *ngIf="showSuggestions && suggestions.length > 0" 
           class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
        <div *ngFor="let suggestion of suggestions" 
             (click)="selectSuggestion(suggestion)"
             class="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0">
          <div class="flex items-start gap-2">
            <svg class="w-5 h-5 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ suggestion.label }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <p *ngIf="error" class="mt-1 text-sm text-red-500">{{ error }}</p>
      <p *ngIf="selectedLocation && !error" class="mt-1 text-sm text-green-600 dark:text-green-400">
        📍 Emplacement sélectionné
      </p>
    </div>
  `,
  styles: [`
    :host {
      position: relative;
      display: block;
    }
  `]
})
export class LocationSearchComponent implements OnInit, OnDestroy {
  @Input() label = 'Location';
  @Input() placeholder = 'Rechercher un lieu...';
  @Input() required = false;
  @Input() initialValue = '';
  @Output() locationSelected = new EventEmitter<LocationData>();
  
  searchValue = '';
  selectedLocation: LocationData | null = null;
  error = '';
  searching = false;
  showSuggestions = false;
  suggestions: any[] = [];
  
  private provider: OpenStreetMapProvider;
  private searchSubject = new Subject<string>();

  constructor() {
    this.provider = new OpenStreetMapProvider();
  }

  ngOnInit() {
    this.searchValue = this.initialValue;
    
    // Debounce search
    this.searchSubject.pipe(
      debounceTime(500)
    ).subscribe(query => {
      this.performSearch(query);
    });

    // Close suggestions when clicking outside
    document.addEventListener('click', this.handleClickOutside.bind(this));
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.handleClickOutside.bind(this));
  }

  onSearchChange(value: string) {
    if (value.length >= 3) {
      this.searching = true;
      this.error = '';
      this.selectedLocation = null;
      this.searchSubject.next(value);
    } else {
      this.suggestions = [];
      this.showSuggestions = false;
    }
  }

  async performSearch(query: string) {
    try {
      const results = await this.provider.search({ query });
      this.suggestions = results;
      this.showSuggestions = results.length > 0;
      this.searching = false;
      
      if (results.length === 0) {
        this.error = 'Aucun résultat trouvé';
      }
    } catch (error) {
      console.error('Search error:', error);
      this.error = 'Erreur lors de la recherche';
      this.searching = false;
      this.suggestions = [];
    }
  }

  selectSuggestion(suggestion: any) {
    this.selectedLocation = {
      address: suggestion.label,
      latitude: suggestion.y,
      longitude: suggestion.x
    };
    
    this.searchValue = suggestion.label;
    this.showSuggestions = false;
    this.suggestions = [];
    this.error = '';
    
    this.locationSelected.emit(this.selectedLocation);
  }

  handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('app-location-search')) {
      this.showSuggestions = false;
    }
  }
}
