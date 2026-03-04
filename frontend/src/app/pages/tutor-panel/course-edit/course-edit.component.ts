import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Course, CourseStatus, CEFR_LEVELS } from '../../../core/models/course.model';
import { CourseCategory } from '../../../core/models/course-category.model';
import { CourseService } from '../../../core/services/course.service';
import { CourseCategoryService } from '../../../core/services/course-category.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-course-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './course-edit.component.html',
  styleUrls: ['./course-edit.component.scss']
})
export class CourseEditComponent implements OnInit {
  course: Course = {
    title: '',
    description: '',
    category: '',
    level: 'A1',
    maxStudents: 30,
    duration: 10,
    tutorId: 0,
    price: 0,
    objectives: '',
    prerequisites: '',
    isFeatured: false,
    status: CourseStatus.DRAFT
  };

  categories: CourseCategory[] = [];
  levels = CEFR_LEVELS;
  statuses = Object.values(CourseStatus);
  
  loading = false;
  saving = false;
  message = '';
  messageType: 'success' | 'error' = 'success';
  
  currentStep = 1;
  totalSteps = 4;
  courseId: number = 0;

  // File uploads
  thumbnailFile: File | null = null;
  thumbnailPreview: string | null = null;
  courseFiles: File[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private courseService: CourseService,
    private categoryService: CourseCategoryService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.courseId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.courseId) {
      this.loadCourse();
    }
    this.loadCategories();
  }

  loadCourse(): void {
    this.loading = true;
    this.courseService.getCourseById(this.courseId).subscribe({
      next: (course) => {
        this.course = course;
        // Construct full URL for thumbnail if it exists
        if (course.thumbnailUrl && !course.thumbnailUrl.startsWith('http')) {
          this.thumbnailPreview = `http://localhost:8088/api${course.thumbnailUrl}`;
        } else {
          this.thumbnailPreview = course.thumbnailUrl || null;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading course:', error);
        this.showMessage('Failed to load course', 'error');
        this.loading = false;
      }
    });
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

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      this.showMessage('Please fill in all required fields', 'error');
      return;
    }

    this.saving = true;
    this.courseService.updateCourse(this.courseId, this.course).subscribe({
      next: () => {
        // Upload files if any
        this.uploadFiles(this.courseId);
      },
      error: (error) => {
        console.error('Error updating course:', error);
        this.showMessage('Failed to update course. Please try again.', 'error');
        this.saving = false;
      }
    });
  }

  uploadFiles(courseId: number): void {
    let uploadCount = 0;
    let totalUploads = 0;

    // Count total uploads
    if (this.thumbnailFile) totalUploads++;
    if (this.courseFiles.length > 0) totalUploads += this.courseFiles.length;

    if (totalUploads === 0) {
      this.showMessage('Course updated successfully!', 'success');
      setTimeout(() => {
        this.router.navigate(['/tutor-panel/courses']);
      }, 1500);
      return;
    }

    // Upload thumbnail
    if (this.thumbnailFile) {
      this.courseService.uploadThumbnail(courseId, this.thumbnailFile).subscribe({
        next: () => {
          uploadCount++;
          if (uploadCount === totalUploads) {
            this.finishUpload();
          }
        },
        error: (error) => {
          console.error('Error uploading thumbnail:', error);
          uploadCount++;
          if (uploadCount === totalUploads) {
            this.finishUpload();
          }
        }
      });
    }

    // Upload course materials
    this.courseFiles.forEach((file, index) => {
      this.courseService.uploadCourseMaterial(courseId, file).subscribe({
        next: () => {
          uploadCount++;
          if (uploadCount === totalUploads) {
            this.finishUpload();
          }
        },
        error: (error) => {
          console.error(`Error uploading file ${index + 1}:`, error);
          uploadCount++;
          if (uploadCount === totalUploads) {
            this.finishUpload();
          }
        }
      });
    });
  }

  finishUpload(): void {
    this.showMessage('Course updated and files uploaded successfully!', 'success');
    setTimeout(() => {
      this.router.navigate(['/tutor-panel/courses']);
    }, 1500);
  }

  validateForm(): boolean {
    return !!(
      this.course.title &&
      this.course.description &&
      this.course.category &&
      this.course.level &&
      this.course.duration &&
      this.course.duration > 0
    );
  }

  showMessage(text: string, type: 'success' | 'error'): void {
    this.message = text;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
    }, 5000);
  }

  goBack(): void {
    this.router.navigate(['/tutor-panel/courses']);
  }

  getCategoryIcon(categoryName: string): string {
    const category = this.categories.find(c => c.name === categoryName);
    return category?.icon || '📚';
  }

  getCategoryColor(categoryName: string): string {
    const category = this.categories.find(c => c.name === categoryName);
    return category?.color || '#3B82F6';
  }

  // File handling methods
  onThumbnailSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      this.thumbnailFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.thumbnailPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeThumbnail(): void {
    this.thumbnailFile = null;
    this.thumbnailPreview = null;
    this.course.thumbnailUrl = undefined;
  }

  onFilesSelected(event: any): void {
    const files = Array.from(event.target.files) as File[];
    this.courseFiles = [...this.courseFiles, ...files];
  }

  removeFile(index: number): void {
    this.courseFiles.splice(index, 1);
  }

  getFileIcon(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const icons: Record<string, string> = {
      'pdf': '📄',
      'doc': '📝',
      'docx': '📝',
      'ppt': '📊',
      'pptx': '📊',
      'xls': '📈',
      'xlsx': '📈',
      'zip': '🗜️',
      'mp4': '🎥',
      'mp3': '🎵',
      'jpg': '🖼️',
      'jpeg': '🖼️',
      'png': '🖼️'
    };
    return icons[ext || ''] || '📎';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
