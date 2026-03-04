import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PackService } from '../../../core/services/pack.service';
import { CourseService } from '../../../core/services/course.service';
import { CourseCategoryService } from '../../../core/services/course-category.service';
import { PackEnrollmentService } from '../../../core/services/pack-enrollment.service';
import { AuthService } from '../../../core/services/auth.service';
import { Pack } from '../../../core/models/pack.model';
import { Course } from '../../../core/models/course.model';
import { CourseCategory } from '../../../core/models/course-category.model';

@Component({
  selector: 'app-student-pack-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './student-pack-details.component.html',
  styleUrls: ['./student-pack-details.component.scss']
})
export class StudentPackDetailsComponent implements OnInit {
  pack: Pack | null = null;
  courses: Course[] = [];
  category: CourseCategory | null = null;
  loading = true;
  enrolling = false;
  isEnrolled = false;
  checkingEnrollment = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private packService: PackService,
    private courseService: CourseService,
    private categoryService: CourseCategoryService,
    private enrollmentService: PackEnrollmentService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const packId = this.route.snapshot.paramMap.get('id');
    if (packId) {
      this.loadPackDetails(+packId);
      this.checkIfEnrolled(+packId);
    }
  }

  loadPackDetails(packId: number): void {
    this.loading = true;
    this.packService.getById(packId).subscribe({
      next: (pack) => {
        this.pack = pack;
        this.loadCourses(pack.courseIds);
        this.loadCategory(pack.category);
      },
      error: (error) => {
        console.error('Error loading pack:', error);
        this.loading = false;
      }
    });
  }

  checkIfEnrolled(packId: number): void {
    const user = this.authService.currentUserValue;
    if (!user || !user.id) return;

    this.checkingEnrollment = true;
    this.enrollmentService.isStudentEnrolled(user.id, packId).subscribe({
      next: (enrolled) => {
        this.isEnrolled = enrolled;
        this.checkingEnrollment = false;
      },
      error: (error) => {
        console.error('Error checking enrollment:', error);
        this.checkingEnrollment = false;
      }
    });
  }

  loadCourses(courseIds: number[]): void {
    if (!courseIds || courseIds.length === 0) {
      this.loading = false;
      return;
    }

    const courseRequests = courseIds.map(id => 
      this.courseService.getCourseById(id).toPromise()
    );

    Promise.all(courseRequests).then(courses => {
      this.courses = courses.filter(c => c !== undefined) as Course[];
      this.loading = false;
    }).catch(error => {
      console.error('Error loading courses:', error);
      this.loading = false;
    });
  }

  loadCategory(categoryName: string): void {
    this.categoryService.getActiveCategories().subscribe({
      next: (categories) => {
        this.category = categories.find(c => c.name === categoryName) || null;
      },
      error: (error) => {
        console.error('Error loading category:', error);
      }
    });
  }

  enrollInPack(): void {
    const user = this.authService.currentUserValue;
    if (!user || !user.id || !this.pack || !this.pack.id) return;

    if (confirm(`Enroll in "${this.pack.name}" for $${this.pack.price}?`)) {
      this.enrolling = true;
      this.enrollmentService.enrollStudent(user.id, this.pack.id).subscribe({
        next: () => {
          this.enrolling = false;
          this.isEnrolled = true;
          if (this.pack && this.pack.availableSlots) {
            this.pack.availableSlots--;
          }
          alert('🎉 Enrollment successful! Redirecting to My Packs...');
          setTimeout(() => {
            this.router.navigate(['/user-panel/my-packs']);
          }, 1000);
        },
        error: (error) => {
          console.error('Error enrolling:', error);
          this.enrolling = false;
          alert('❌ Enrollment failed. Please try again.');
        }
      });
    }
  }

  goToMyPacks(): void {
    this.router.navigate(['/user-panel/my-packs']);
  }

  goBack(): void {
    this.router.navigate(['/user-panel/pack-catalog']);
  }

  getCategoryColor(): string {
    return this.category?.color || '#3B82F6';
  }

  getCategoryIcon(): string {
    return this.category?.icon || '📚';
  }

  getEnrollmentPercentage(): number {
    if (!this.pack || !this.pack.maxStudents || this.pack.maxStudents === 0) return 0;
    const enrolled = this.pack.currentEnrolledStudents || 0;
    return Math.round((enrolled / this.pack.maxStudents) * 100);
  }

  getTotalDuration(): number {
    return this.courses.reduce((total, course) => total + ((course as any).estimatedDuration || 0), 0);
  }

  getTotalLessons(): number {
    return this.courses.reduce((total, course) => {
      const chapters = (course as any).chapters || [];
      return total + chapters.reduce((chapterTotal: number, chapter: any) => 
        chapterTotal + (chapter.lessons?.length || 0), 0);
    }, 0);
  }

  getCourseDuration(course: Course): number {
    return (course as any).estimatedDuration || 0;
  }

  getCourseChaptersCount(course: Course): number {
    const chapters = (course as any).chapters || [];
    return chapters.length;
  }
}
