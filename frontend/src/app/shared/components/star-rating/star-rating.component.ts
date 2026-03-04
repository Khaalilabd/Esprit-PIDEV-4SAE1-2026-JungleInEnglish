import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './star-rating.component.html',
  styleUrls: ['./star-rating.component.scss']
})
export class StarRatingComponent {
  @Input() rating: number = 0;
  @Input() maxRating: number = 5;
  @Input() readonly: boolean = false;
  @Input() showValue: boolean = true;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() allowHalf: boolean = true; // Allow half-star ratings
  @Output() ratingChange = new EventEmitter<number>();

  stars: { full: boolean; half: boolean; empty: boolean }[] = [];
  hoverRating: number = 0;
  isHovering: boolean = false;

  ngOnInit() {
    this.updateStars();
  }

  ngOnChanges() {
    if (!this.isHovering) {
      this.updateStars();
    }
  }

  updateStars() {
    this.stars = [];
    const displayRating = this.isHovering ? this.hoverRating : this.rating;
    
    for (let i = 0; i < this.maxRating; i++) {
      const starValue = i + 1;
      
      if (displayRating >= starValue) {
        // Full star
        this.stars.push({ full: true, half: false, empty: false });
      } else if (displayRating > i && displayRating < starValue) {
        // Half star (rating is between i and i+1)
        this.stars.push({ full: false, half: true, empty: false });
      } else {
        // Empty star
        this.stars.push({ full: false, half: false, empty: true });
      }
    }
    
    console.log('Display rating:', displayRating, 'Stars:', this.stars);
  }

  onStarClick(index: number, event: MouseEvent) {
    if (!this.readonly) {
      const newRating = this.calculateRating(index, event);
      this.rating = newRating;
      this.ratingChange.emit(this.rating);
      this.updateStars();
    }
  }

  onStarHover(index: number, event: MouseEvent) {
    if (!this.readonly) {
      this.isHovering = true;
      this.hoverRating = this.calculateRating(index, event);
      this.updateStars();
    }
  }

  onMouseLeave() {
    if (!this.readonly) {
      this.isHovering = false;
      this.hoverRating = 0;
      this.updateStars();
    }
  }

  calculateRating(index: number, event: MouseEvent): number {
    if (!this.allowHalf) {
      return index + 1;
    }

    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const width = rect.width;
    const percentage = x / width;

    console.log('Star index:', index, 'X position:', x, 'Width:', width, 'Percentage:', percentage);

    // Determine if it's a half star or full star
    // If mouse is in the left half (0-50%), give half star
    // If mouse is in the right half (50-100%), give full star
    if (percentage <= 0.5) {
      const rating = index + 0.5;
      console.log('Half star:', rating);
      return rating;
    } else {
      const rating = index + 1;
      console.log('Full star:', rating);
      return rating;
    }
  }

  getSizeClass(): string {
    switch (this.size) {
      case 'small':
        return 'text-2xl';
      case 'large':
        return 'text-6xl';
      default:
        return 'text-4xl';
    }
  }

  getDisplayRating(): number {
    return this.isHovering ? this.hoverRating : this.rating;
  }
}
