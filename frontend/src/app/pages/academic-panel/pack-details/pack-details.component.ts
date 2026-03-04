import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PackService } from '../../../core/services/pack.service';
import { CourseService } from '../../../core/services/course.service';
import { CourseCategoryService } from '../../../core/services/course-category.service';
import { PackEnrollmentService } from '../../../core/services/pack-enrollment.service';
import { Pack } from '../../../core/models/pack.model';
import { Course } from '../../../core/models/course.model';
import { CourseCategory } from '../../../core/models/course-category.model';
import { PackEnrollment } from '../../../core/models/pack-enrollment.model';

@Component({
  selector: 'app-pack-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './pack-details.component.html',
  styleUrls: ['./pack-details.component.scss']
})
export class PackDetailsComponent implements OnInit {
  pack: Pack | null = null;
  courses: Course[] = [];
  category: CourseCategory | null = null;
  enrollments: PackEnrollment[] = [];
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private packService: PackService,
    private courseService: CourseService,
    private categoryService: CourseCategoryService,
    private enrollmentService: PackEnrollmentService
  ) {}

  ngOnInit(): void {
    const packId = this.route.snapshot.paramMap.get('id');
    if (packId) {
      this.loadPackDetails(+packId);
    }
  }

  loadPackDetails(packId: number): void {
    this.loading = true;
    this.packService.getById(packId).subscribe({
      next: (pack) => {
        this.pack = pack;
        this.loadCourses(pack.courseIds);
        this.loadCategory(pack.category);
        this.loadEnrollments(packId);
      },
      error: (error) => {
        console.error('Error loading pack:', error);
        this.loading = false;
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

  loadEnrollments(packId: number): void {
    this.enrollmentService.getByPackId(packId).subscribe({
      next: (enrollments) => {
        this.enrollments = enrollments;
      },
      error: (error) => {
        console.error('Error loading enrollments:', error);
      }
    });
  }

  getCategoryColor(): string {
    return this.category?.color || '#3B82F6';
  }

  getCategoryIcon(): string {
    return this.category?.icon || '📚';
  }

  getEnrollmentPercentage(): number {
    if (!this.pack || !this.pack.maxStudents || this.pack.maxStudents === 0) return 0;
    return Math.round(((this.pack.currentEnrolledStudents || 0) / this.pack.maxStudents) * 100);
  }

  getTotalChapters(): number {
    return this.courses.reduce((sum, course) => sum + (course.chapterCount || 0), 0);
  }

  getTotalLessons(): number {
    return this.courses.reduce((sum, course) => sum + (course.lessonCount || 0), 0);
  }

  getActiveEnrollments(): number {
    return this.enrollments.filter(e => e.status === 'ACTIVE').length;
  }

  getCompletedEnrollments(): number {
    return this.enrollments.filter(e => e.status === 'COMPLETED').length;
  }

  getStudentInitials(name: string): string {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getDaysEnrolled(enrolledAt: string): number {
    const enrolled = new Date(enrolledAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - enrolled.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  goBack(): void {
    this.router.navigate(['/dashboard/packs']);
  }

  editPack(): void {
    if (this.pack && this.pack.id) {
      this.router.navigate(['/dashboard/packs/edit', this.pack.id]);
    }
  }
}
