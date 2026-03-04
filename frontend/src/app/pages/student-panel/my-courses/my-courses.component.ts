import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { PackEnrollmentService } from '../../../core/services/pack-enrollment.service';
import { PackService } from '../../../core/services/pack.service';
import { CourseService } from '../../../core/services/course.service';
import { CourseEnrollmentService } from '../../../core/services/course-enrollment.service';
import { CourseCategoryService } from '../../../core/services/course-category.service';
import { LessonProgressService } from '../../../core/services/lesson-progress.service';
import { AuthService } from '../../../core/services/auth.service';
import { PackEnrollment } from '../../../core/models/pack-enrollment.model';
import { Pack } from '../../../core/models/pack.model';
import { Course } from '../../../core/models/course.model';
import { CourseCategory } from '../../../core/models/course-category.model';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
  selector: 'app-my-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './my-courses.component.html',
  styleUrls: ['./my-courses.component.scss']
})
export class MyCoursesComponent implements OnInit {
  enrollments: PackEnrollment[] = [];
  courses: Course[] = [];
  categories: CourseCategory[] = [];
  courseProgressMap: Map<number, number> = new Map();
  
  selectedCategory: string | null = null;
  selectedLevel: string | null = null;
  searchQuery = '';
  
  loading = true;
  currentStudentId: number = 0;

  constructor(
    private packEnrollmentService: PackEnrollmentService,
    private packService: PackService,
    private courseService: CourseService,
    private courseEnrollmentService: CourseEnrollmentService,
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
    this.loadMyCourses();
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

  loadMyCourses(): void {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) {
      console.log('No current user');
      return;
    }

    console.log('Loading courses for user:', currentUser.id);
    this.loading = true;
    
    // Load enrollments
    this.packEnrollmentService.getByStudentId(currentUser.id).subscribe({
      next: (enrollments) => {
        console.log('Enrollments loaded:', enrollments);
        this.enrollments = enrollments;
        
        if (enrollments.length === 0) {
          console.log('No enrollments found');
          this.loading = false;
          return;
        }
        
        // Load packs to get course IDs
        const packRequests = enrollments.map(enrollment => {
          console.log('Loading pack:', enrollment.packId);
          return this.packService.getById(enrollment.packId).pipe(
            catchError((error) => {
              console.error('Error loading pack', enrollment.packId, error);
              return of(null);
            })
          );
        });
        
        forkJoin(packRequests).subscribe({
          next: (packs) => {
            console.log('Packs loaded:', packs);
            
            // Extract all course IDs
            const courseIds = new Set<number>();
            packs.forEach(pack => {
              if (pack && pack.courseIds) {
                console.log('Pack', pack.id, 'has courses:', pack.courseIds);
                pack.courseIds.forEach(id => courseIds.add(id));
              }
            });
            
            console.log('Total unique course IDs:', Array.from(courseIds));
            
            if (courseIds.size === 0) {
              console.log('No course IDs found in packs');
              this.loading = false;
              return;
            }
            
            // Load all courses
            const courseRequests = Array.from(courseIds).map(courseId => {
              console.log('Loading course:', courseId);
              return this.courseService.getCourseById(courseId).pipe(
                catchError((error) => {
                  console.error('Error loading course', courseId, error);
                  return of(null);
                })
              );
            });
            
            forkJoin(courseRequests).subscribe({
              next: (courses) => {
                console.log('Courses loaded:', courses);
                this.courses = courses.filter(c => c !== null) as Course[];
                console.log('Final courses array:', this.courses);
                
                // Load progress for each course
                this.loadCoursesProgress();
                
                this.loading = false;
              },
              error: (error) => {
                console.error('Error loading courses:', error);
                this.loading = false;
              }
            });
          },
          error: (error) => {
            console.error('Error loading packs:', error);
            this.loading = false;
          }
        });
      },
      error: (error) => {
        console.error('Error loading enrollments:', error);
        this.loading = false;
      }
    });
  }

  loadPackCourses(packId: number, courseIds: Set<number>): void {
    // This method is no longer needed
  }

  loadCoursesProgress(): void {
    if (!this.currentStudentId || this.courses.length === 0) return;
    
    // Load progress for each course
    this.courses.forEach(course => {
      if (course.id) {
        this.progressService.getCourseProgressSummary(this.currentStudentId, course.id).subscribe({
          next: (summary) => {
            this.courseProgressMap.set(course.id!, summary.progressPercentage || 0);
          },
          error: (error) => {
            console.error('Error loading progress for course', course.id, error);
            this.courseProgressMap.set(course.id!, 0);
          }
        });
      }
    });
  }

  get filteredCourses(): Course[] {
    return this.courses.filter(course => {
      const matchesCategory = !this.selectedCategory || course.category === this.selectedCategory;
      const matchesLevel = !this.selectedLevel || course.level === this.selectedLevel;
      const matchesSearch = !this.searchQuery || 
        course.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        course.description?.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      return matchesCategory && matchesLevel && matchesSearch;
    });
  }

  startCourse(course: Course): void {
    // Navigate directly to course learning
    this.router.navigate(['../course', course.id, 'learning'], { 
      relativeTo: this.route
    });
  }

  getCourseProgress(courseId: number): number {
    return this.courseProgressMap.get(courseId) || 0;
  }

  getCategoryIcon(categoryName: string): string {
    const category = this.categories.find(c => c.name === categoryName);
    return category?.icon || '📚';
  }

  getCategoryColor(categoryName: string): string {
    const category = this.categories.find(c => c.name === categoryName);
    return category?.color || '#3B82F6';
  }

  filterByCategory(category: string | null): void {
    this.selectedCategory = category;
  }

  filterByLevel(level: string | null): void {
    this.selectedLevel = level;
  }

  clearFilters(): void {
    this.selectedCategory = null;
    this.selectedLevel = null;
    this.searchQuery = '';
  }

  // FIX 1: Unenroll from course functionality
  unenrollFromCourse(course: Course): void {
    if (!course.id) return;
    
    const confirmed = confirm(
      `Are you sure you want to unenroll from "${course.title}"?\n\nYour progress will be lost and cannot be recovered.`
    );
    
    if (!confirmed) return;
    
    this.courseEnrollmentService.unenrollStudent(this.currentStudentId, course.id).subscribe({
      next: () => {
        // Clear cache for this course
        this.progressService.clearCache(course.id);
        
        // Remove course from local list
        this.courses = this.courses.filter(c => c.id !== course.id);
        this.courseProgressMap.delete(course.id!);
        
        // Show success message
        alert(`Successfully unenrolled from "${course.title}"`);
      },
      error: (error) => {
        console.error('Error unenrolling from course:', error);
        alert('Failed to unenroll. Please try again.');
      }
    });
  }
}
