import { Component, Input, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SlideData {
  title: string;
  image: string;
  icon: string;
}

@Component({
  selector: 'app-event-slider',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-slider.component.html',
  styleUrls: ['./event-slider.component.scss']
})
export class EventSliderComponent implements OnInit, OnDestroy {
  @Input() slides: SlideData[] = [
    { title: 'Workshops', image: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/537051/city--1-min-min.jpg', icon: '🛠️' },
    { title: 'Seminars', image: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/537051/city--2-min-min.jpg', icon: '📚' },
    { title: 'Social Events', image: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/537051/city--3-min-min.jpg', icon: '🎉' }
  ];

  currentSlide = 0;
  animation = false;
  diff = 0;
  startX = 0;
  isDragging = false;
  animSpd = 750;
  distOfLetGo = 0;
  private wheelTimeout: any;
  private isWheeling = false;

  ngOnInit() {
    this.distOfLetGo = window.innerWidth * 0.2;
  }

  ngOnDestroy() {
    if (this.wheelTimeout) {
      clearTimeout(this.wheelTimeout);
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.distOfLetGo = window.innerWidth * 0.2;
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowRight') {
      this.navigateRight();
    } else if (event.key === 'ArrowLeft') {
      this.navigateLeft();
    }
  }

  onMouseDown(event: MouseEvent | TouchEvent) {
    if (this.animation) return;
    
    this.startX = event instanceof MouseEvent ? event.pageX : event.touches[0].pageX;
    this.isDragging = true;
    
    // Prevent default to avoid text selection
    event.preventDefault();
  }

  onMouseMove(event: MouseEvent | TouchEvent) {
    if (!this.isDragging || this.animation) return;

    const x = event instanceof MouseEvent ? event.pageX : event.touches[0].pageX;
    this.diff = this.startX - x;

    // Prevent dragging beyond boundaries
    if ((this.currentSlide === 0 && this.diff < 0) || 
        (this.currentSlide === this.slides.length - 1 && this.diff > 0)) {
      return;
    }
    
    // Prevent default to avoid page scroll while dragging
    event.preventDefault();
  }

  onMouseUp() {
    if (!this.isDragging) return;
    
    this.isDragging = false;

    if (this.animation) return;

    if (this.diff >= this.distOfLetGo) {
      this.navigateRight();
    } else if (this.diff <= -this.distOfLetGo) {
      this.navigateLeft();
    } else {
      this.toDefault();
    }
  }

  onWheel(event: WheelEvent) {
    // Prevent multiple rapid wheel events
    if (this.isWheeling || this.animation) {
      event.preventDefault();
      return;
    }

    this.isWheeling = true;
    
    // Determine direction
    if (event.deltaY > 0) {
      // Scroll down = next slide
      this.navigateRight();
    } else if (event.deltaY < 0) {
      // Scroll up = previous slide
      this.navigateLeft();
    }

    // Reset wheeling flag after animation
    if (this.wheelTimeout) {
      clearTimeout(this.wheelTimeout);
    }
    
    this.wheelTimeout = setTimeout(() => {
      this.isWheeling = false;
    }, this.animSpd + 100);

    // Prevent page scroll
    event.preventDefault();
  }

  navigateRight() {
    if (this.currentSlide >= this.slides.length - 1) return;
    this.pagination(0);
    this.currentSlide++;
  }

  navigateLeft() {
    if (this.currentSlide <= 0) return;
    this.pagination(2);
    this.currentSlide--;
  }

  toDefault() {
    this.pagination(1);
  }

  pagination(direction: number) {
    this.animation = true;
    this.diff = 0;
    setTimeout(() => {
      this.animation = false;
    }, this.animSpd);
  }

  goToSlide(index: number) {
    if (this.animation || index === this.currentSlide) return;
    this.currentSlide = index;
    this.pagination(1);
  }

  getTransform(): string {
    const baseTransform = -this.currentSlide * 100;
    const dragOffset = this.isDragging ? -(this.diff / 30) : 0;
    return `translate3d(calc(${baseTransform}% + ${dragOffset}px), 0, 0)`;
  }

  getDarkBgTransform(): string {
    const baseTransform = this.currentSlide * 50;
    const dragOffset = this.isDragging ? (this.diff / 60) : 0;
    return `translate3d(calc(${baseTransform}% + ${dragOffset}px), 0, 0)`;
  }

  getLetterTransform(): string {
    const dragOffset = this.isDragging ? (this.diff / 60) : 0;
    return `translate3d(${dragOffset}px, 0, 0)`;
  }

  getTextTransform(): string {
    const dragOffset = this.isDragging ? (this.diff / 15) : 0;
    return `translate3d(${dragOffset}px, 0, 0)`;
  }

  splitTitle(title: string): string[] {
    const length = title.length;
    const letters = Math.floor(length / 4);
    const regex = new RegExp(`.{1,${letters}}`, 'g');
    return title.match(regex) || [title];
  }

  getFirstLetter(title: string): string {
    return title.charAt(0);
  }
}
