import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { PackEnrollmentService } from '../../../core/services/pack-enrollment.service';
import { PackService } from '../../../core/services/pack.service';
import { CourseService } from '../../../core/services/course.service';
import { CourseCategoryService } from '../../../core/services/course-category.service';
import { LessonProgressService } from '../../../core/services/lesson-progress.service';
import { AuthService } from '../../../core/services/auth.service';
import { PackEnrollment } from '../../../core/models/pack-enrollment.model';
import { Pack } from '../../../core/models/pack.model';
import { Course } from '../../../core/models/course.model';
import { CourseCategory } from '../../../core/models/course-category.model';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface CourseWithLessons extends Course {
  totalLessons?: number;
}

interface PackWithDetails extends PackEnrollment {
  pack?: Pack;
  courses?: CourseWithLessons[];
}

@Component({
  selector: 'app-my-packs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-packs.component.html',
  styleUrls: ['./my-packs.component.scss']
})
export class MyPacksComponent implements OnInit {
  enrollments: PackWithDetails[] = [];
  categories: CourseCategory[] = [];
  
  loading = false;
  currentStudentId: number = 0;
  
  message = '';
  messageType: 'success' | 'error' = 'success';

  constructor(
    private packEnrollmentService: PackEnrollmentService,
    private packService: PackService,
    private courseService: CourseService,
    private categoryService: CourseCategoryService,
    private progressService: LessonProgressService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.currentStudentId = currentUser.id;
    }
    this.loadCategories();
    this.loadMyEnrollments();
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

  loadMyEnrollments(): void {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return;

    this.loading = true;
    this.packEnrollmentService.getByStudentId(currentUser.id).subscribe({
      next: (enrollments) => {
        console.log('Pack enrollments received:', enrollments);
        enrollments.forEach(e => {
          console.log(`Pack ${e.packName}: progressPercentage = ${e.progressPercentage}`);
        });
        
        if (enrollments.length === 0) {
          this.enrollments = [];
          this.loading = false;
          return;
        }

        // Load pack details and courses for each enrollment
        const packDetailsRequests = enrollments.map(enrollment => 
          this.loadPackDetails(enrollment)
        );

        Promise.all(packDetailsRequests).then(packsWithDetails => {
          this.enrollments = packsWithDetails.filter(p => p !== null) as PackWithDetails[];
          this.loading = false;
        });
      },
      error: (error) => {
        console.error('Error loading enrollments:', error);
        this.showMessage('Failed to load your packs', 'error');
        this.loading = false;
      }
    });
  }

  async loadPackDetails(enrollment: PackEnrollment): Promise<PackWithDetails | null> {
    try {
      const pack = await this.packService.getById(enrollment.packId).pipe(
        catchError(() => of(null))
      ).toPromise();
      
      if (!pack) return null;
      
      const packWithDetails: PackWithDetails = { ...enrollment, pack, courses: [] };
      
      // Load courses with their actual lesson counts
      if (pack.courseIds && pack.courseIds.length > 0) {
        const coursesWithLessons = await Promise.all(
          pack.courseIds.map(async (courseId) => {
            const course = await this.courseService.getCourseById(courseId).pipe(
              catchError(() => of(null))
            ).toPromise();
            
            if (!course) return null;
            
            // Get actual lesson count from progress summary
            if (this.currentStudentId) {
              try {
                const summary = await this.progressService.getCourseProgressSummary(
                  this.currentStudentId, 
                  courseId
                ).toPromise();
                
                return {
                  ...course,
                  totalLessons: summary?.totalLessons || 0
                } as CourseWithLessons;
              } catch (error) {
                return { ...course, totalLessons: 0 } as CourseWithLessons;
              }
            }
            
            return { ...course, totalLessons: 0 } as CourseWithLessons;
          })
        );
        
        packWithDetails.courses = coursesWithLessons.filter(c => c !== null) as CourseWithLessons[];
      }
      
      return packWithDetails;
    } catch (error) {
      console.error('Error loading pack details:', error);
      return null;
    }
  }

  getTotalChapters(courses: CourseWithLessons[] | undefined): number {
    if (!courses) return 0;
    return courses.reduce((total, course) => total + (course.chapterCount || 0), 0);
  }

  getTotalLessons(courses: CourseWithLessons[] | undefined): number {
    if (!courses) return 0;
    // Sum up actual lesson counts from each course
    return courses.reduce((total, course) => total + (course.totalLessons || 0), 0);
  }

  viewPackDetails(enrollment: PackWithDetails): void {
    // Navigate to pack learning page to study
    this.router.navigate(['../pack', enrollment.packId, 'learning'], { relativeTo: this.route });
  }

  continueLearning(enrollment: PackWithDetails): void {
    // Navigate to pack learning page
    this.router.navigate(['../pack', enrollment.packId, 'learning'], { relativeTo: this.route });
  }

  getCategoryIcon(categoryName: string): string {
    const category = this.categories.find(c => c.name === categoryName);
    return category?.icon || '📚';
  }

  getCategoryColor(categoryName: string): string {
    const category = this.categories.find(c => c.name === categoryName);
    return category?.color || '#3B82F6';
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getProgressBarColor(progress: number): string {
    // Interpolate between blood red (0%) and dark green (100%)
    // Blood Red: rgb(139, 0, 0) = #8B0000
    // Dark Green: rgb(0, 100, 0) = #006400
    
    // Ensure progress is a valid number
    const validProgress = progress || 0;
    console.log('Progress bar color for:', validProgress);
    
    const percentage = Math.max(0, Math.min(100, validProgress)) / 100;
    
    // Start color (Blood Red)
    const startR = 139;
    const startG = 0;
    const startB = 0;
    
    // End color (Dark Green)
    const endR = 0;
    const endG = 100;
    const endB = 0;
    
    // Interpolate
    const r = Math.round(startR + (endR - startR) * percentage);
    const g = Math.round(startG + (endG - startG) * percentage);
    const b = Math.round(startB + (endB - startB) * percentage);
    
    const color = `rgb(${r}, ${g}, ${b})`;
    console.log(`Progress ${validProgress}% -> Color: ${color}`);
    
    return color;
  }

  showMessage(text: string, type: 'success' | 'error'): void {
    this.message = text;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
    }, 5000);
  }
}
