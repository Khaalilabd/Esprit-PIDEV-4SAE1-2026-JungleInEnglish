import { Component, Input, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

@Component({
  selector: 'app-location-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './location-map.component.html',
  styleUrls: ['./location-map.component.scss']
})
export class LocationMapComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  @Input() latitude?: number;
  @Input() longitude?: number;
  @Input() address?: string;
  @Input() height = 300;
  @Input() zoom = 15;

  private map?: L.Map;
  private marker?: L.Marker;

  ngOnInit() {
    // Component initialized
  }

  ngAfterViewInit() {
    if (this.latitude && this.longitude) {
      // Attendre que le DOM soit complètement rendu
      setTimeout(() => this.initMap(), 100);
    }
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap() {
    console.log('🗺️ Initializing map with:', {
      latitude: this.latitude,
      longitude: this.longitude,
      address: this.address,
      container: this.mapContainer?.nativeElement,
      containerSize: {
        width: this.mapContainer?.nativeElement?.offsetWidth,
        height: this.mapContainer?.nativeElement?.offsetHeight
      }
    });

    if (!this.mapContainer?.nativeElement) {
      console.error('❌ Map container not found');
      return;
    }

    const container = this.mapContainer.nativeElement;
    
    // Vérifier que le conteneur a une taille
    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
      console.warn('⚠️ Container has no size, retrying...');
      setTimeout(() => this.initMap(), 200);
      return;
    }

    try {
      // Create map
      this.map = L.map(container, {
        center: [this.latitude!, this.longitude!],
        zoom: this.zoom,
        scrollWheelZoom: true,
        dragging: true,
        zoomControl: true,
        attributionControl: true,
        preferCanvas: true // Améliore les performances
      });

      console.log('✅ Map created successfully');

      // Add OpenStreetMap tiles
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        minZoom: 1,
        tileSize: 256,
        updateWhenIdle: false,
        updateWhenZooming: false,
        keepBuffer: 2
      });

      tileLayer.on('tileerror', (error) => {
        console.warn('⚠️ Tile loading error:', error);
      });

      tileLayer.on('load', () => {
        console.log('✅ All tiles loaded successfully');
      });

      tileLayer.addTo(this.map);
      console.log('✅ Tile layer added');

      // Custom marker icon
      const customIcon = L.icon({
        iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDMyIDQwIj48cGF0aCBmaWxsPSIjRUY0NDQ0IiBkPSJNMTYgMEMxMC40NzcgMCA2IDQuNDc3IDYgMTBjMCA3LjUgMTAgMjAgMTAgMjBzMTAtMTIuNSAxMC0yMGMwLTUuNTIzLTQuNDc3LTEwLTEwLTEwem0wIDE0Yy0yLjIwOSAwLTQtMS43OTEtNC00czEuNzkxLTQgNC00IDQgMS43OTEgNCA0LTEuNzkxIDQtNCA0eiIvPjwvc3ZnPg==',
        iconSize: [32, 40],
        iconAnchor: [16, 40],
        popupAnchor: [0, -40]
      });

      // Add marker
      this.marker = L.marker([this.latitude!, this.longitude!], {
        icon: customIcon
      }).addTo(this.map);

      console.log('✅ Marker added');

      // Add popup if address is provided
      if (this.address) {
        this.marker.bindPopup(`<strong>${this.address}</strong>`);
      }

      // Forcer plusieurs invalidations de taille pour corriger le problème des tuiles
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize(true);
          console.log('✅ Map size invalidated (1st)');
        }
      }, 100);

      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize(true);
          console.log('✅ Map size invalidated (2nd)');
        }
      }, 300);

      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize(true);
          console.log('✅ Map size invalidated (3rd - final)');
        }
      }, 500);
    } catch (error) {
      console.error('❌ Error initializing map:', error);
    }
  }
}
