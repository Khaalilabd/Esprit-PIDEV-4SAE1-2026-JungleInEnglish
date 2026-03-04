import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PackService } from '../../../core/services/pack.service';
import { PackEnrollmentService } from '../../../core/services/pack-enrollment.service';
import { CourseCategoryService } from '../../../core/services/course-category.service';
import { AuthService } from '../../../core/services/auth.service';
import { Pack } from '../../../core/models/pack.model';
import { CourseCategory } from '../../../core/models/course-category.model';

@Component({
  selector: 'app-pack-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pack-catalog.component.html',
  styleUrls: ['./pack-catalog.component.scss']
})
export class PackCatalogComponent implements OnInit {
  packs: Pack[] = [];
  filteredPacks: Pack[] = [];
  categories: CourseCategory[] = [];
  enrolledPackIds: Set<number> = new Set();
  
  loading = true;
  enrolling = false;
  
  searchTerm = '';
  selectedCategory = '';
  selectedLevel = '';
  
  levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  constructor(
    private packService: PackService,
    private packEnrollmentService: PackEnrollmentService,
    private categoryService: CourseCategoryService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadPacks();
    this.loadEnrolledPacks();
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
    this.packService.getAllPacks().subscribe({
      next: (packs: Pack[]) => {
        // Only show ACTIVE packs with open enrollment
        this.packs = packs.filter((p: Pack) => p.status === 'ACTIVE' && p.isEnrollmentOpen);
        this.applyFilters();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading packs:', error);
        this.loading = false;
      }
    });
  }

  loadEnrolledPacks(): void {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return;

    this.packEnrollmentService.getByStudentId(currentUser.id).subscribe({
      next: (enrollments) => {
        this.enrolledPackIds = new Set(enrollments.map(e => e.packId));
      },
      error: (error) => {
        console.error('Error loading enrollments:', error);
      }
    });
  }

  applyFilters(): void {
    this.filteredPacks = this.packs.filter(pack => {
      const matchesSearch = !this.searchTerm || 
        pack.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        pack.description?.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesCategory = !this.selectedCategory || pack.category === this.selectedCategory;
      const matchesLevel = !this.selectedLevel || pack.level === this.selectedLevel;
      
      return matchesSearch && matchesCategory && matchesLevel;
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onCategoryChange(): void {
    this.applyFilters();
  }

  onLevelChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.selectedLevel = '';
    this.applyFilters();
  }

  isEnrolled(packId: number | undefined): boolean {
    if (!packId) return false;
    return this.enrolledPackIds.has(packId);
  }

  viewPackDetails(pack: Pack): void {
    if (!pack.id) return;
    this.router.navigate(['/user-panel/pack-details', pack.id]);
  }

  enrollInPack(pack: Pack, event: Event): void {
    event.stopPropagation();
    
    if (!pack.id) return;
    
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    if (currentUser.role !== 'STUDENT') {
      alert('Only students can enroll in packs');
      return;
    }

    if (this.isEnrolled(pack.id)) {
      this.router.navigate(['/user-panel/my-packs']);
      return;
    }

    if (confirm(`Enroll in "${pack.name}" for $${pack.price}?`)) {
      this.enrolling = true;
      this.packEnrollmentService.enrollStudent(currentUser.id, pack.id).subscribe({
        next: () => {
          this.enrolling = false;
          this.enrolledPackIds.add(pack.id!);
          alert('🎉 Enrollment successful! Redirecting to My Packs...');
          setTimeout(() => {
            this.router.navigate(['/user-panel/my-packs']);
          }, 1000);
        },
        error: (error: any) => {
          console.error('Error enrolling:', error);
          this.enrolling = false;
          alert('❌ Enrollment failed. Please try again.');
        }
      });
    }
  }

  getCategoryIcon(categoryName: string): string {
    const category = this.categories.find(c => c.name === categoryName);
    return category?.icon || '📚';
  }

  getCategoryColor(categoryName: string): string {
    const category = this.categories.find(c => c.name === categoryName);
    return category?.color || '#3B82F6';
  }
}
