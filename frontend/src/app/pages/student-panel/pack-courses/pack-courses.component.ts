import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PackEnrollmentService } from '../../../core/services/pack-enrollment.service';
import { PackService } from '../../../core/services/pack.service';
import { CourseService } from '../../../core/services/course.service';
import { LessonProgressService } from '../../../core/services/lesson-progress.service';
import { AuthService } from '../../../core/services/auth.service';
import { PackEnrollment } from '../../../core/models/pack-enrollment.model';
import { Pack } from '../../../core/models/pack.model';
import { Course } from '../../../core/models/course.model';
import { CourseProgressSummary } from '../../../core/models/lesson-progress.model';

@Component({
  selector: 'app-pack-courses',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './pack-courses.component.html',
  styleUrls: ['./pack-courses.component.scss']
})
export class PackCoursesComponent implements OnInit {
  packId!: number;
  enrollment: PackEnrollment | null = null;
  pack: Pack | null = null;
  courses: Course[] = [];
  courseProgressMap: Map<number, CourseProgressSummary> = new Map();
  
  loading = true;
  currentStudentId: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private packEnrollmentService: PackEnrollmentService,
    private packService: PackService,
    private courseService: CourseService,
    private progressService: LessonProgressService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.packId = +this.route.snapshot.paramMap.get('packId')!;
    const user = this.authService.currentUserValue;
    if (user) {
      this.currentStudentId = user.id;
    }
    this.loadPackData();
  }

  loadPackData(): void {
    this.loading = true;
    const user = this.authService.currentUserValue;
    
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    // Load enrollment
    this.packEnrollmentService.getByStudentId(user.id).subscribe({
      next: (enrollments) => {
        this.enrollment = enrollments.find(e => e.packId === this.packId) || null;
        
        if (!this.enrollment) {
          alert('You are not enrolled in this pack');
          this.router.navigate(['/user-panel/my-packs']);
          return;
        }

        // Load pack details
        this.loadPack();
      },
      error: (error) => {
        console.error('Error loading enrollment:', error);
        this.loading = false;
      }
    });
  }

  loadPack(): void {
    this.packService.getById(this.packId).subscribe({
      next: (pack) => {
        this.pack = pack;
        this.loadCourses(pack.courseIds);
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
      
      // Load progress for each course
      this.loadCoursesProgress();
    }).catch(error => {
      console.error('Error loading courses:', error);
      this.loading = false;
    });
  }

  loadCoursesProgress(): void {
    if (!this.currentStudentId || this.courses.length === 0) {
      this.loading = false;
      return;
    }
    
    let loadedCount = 0;
    const totalCourses = this.courses.length;
    
    // Load progress for each course
    this.courses.forEach(course => {
      if (course.id) {
        this.progressService.getCourseProgressSummary(this.currentStudentId, course.id).subscribe({
          next: (summary) => {
            this.courseProgressMap.set(course.id!, summary);
            console.log(`Course ${course.id}: ${summary.completedLessons}/${summary.totalLessons} lessons (${summary.progressPercentage}%)`);
            
            loadedCount++;
            if (loadedCount === totalCourses) {
              this.loading = false;
            }
          },
          error: (error) => {
            console.error('Error loading progress for course', course.id, error);
            loadedCount++;
            if (loadedCount === totalCourses) {
              this.loading = false;
            }
          }
        });
      }
    });
  }

  startCourse(course: Course): void {
    // Navigate to course learning page with packId as query param
    this.router.navigate(['../../../course', course.id, 'learning'], { 
      relativeTo: this.route,
      queryParams: { packId: this.packId }
    });
  }

  getCourseProgress(courseId: number): number {
    const summary = this.courseProgressMap.get(courseId);
    return summary ? summary.progressPercentage : 0;
  }

  getProgressValue(courseId: number): number {
    const summary = this.courseProgressMap.get(courseId);
    return summary ? summary.progressPercentage : 0;
  }

  getProgressText(courseId: number): string {
    const summary = this.courseProgressMap.get(courseId);
    if (!summary) return '0 / 0 lessons completed';
    
    return `${summary.completedLessons} / ${summary.totalLessons} lessons completed`;
  }

  getCategoryColor(categoryName: string): string {
    const colors: { [key: string]: string } = {
      'General English': '#2D5757',
      'Business English': '#3D3D60',
      'Academic English': '#F6BD60',
      'Pronunciation': '#F6BD60',
      'Grammar': '#C84630',
      'Vocabulary': '#3D3D60',
      'Conversation': '#2D5757',
      'Writing': '#3D3D60',
      'Reading': '#F6BD60',
      'Listening': '#C84630'
    };
    return colors[categoryName] || '#2D5757';
  }

  getCategoryIcon(categoryName: string): string {
    const icons: { [key: string]: string } = {
      'General English': '🌍',
      'Business English': '💼',
      'Academic English': '🎓',
      'Pronunciation': '🗣️',
      'Grammar': '📝',
      'Vocabulary': '📚',
      'Conversation': '💬',
      'Writing': '✍️',
      'Reading': '📖',
      'Listening': '👂'
    };
    return icons[categoryName] || '📚';
  }

  goBack(): void {
    this.router.navigate(['/user-panel/my-packs']);
  }
}
