import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Course, CourseStatus } from '../../../core/models/course.model';
import { CourseCategory } from '../../../core/models/course-category.model';
import { Chapter } from '../../../core/models/chapter.model';
import { Lesson } from '../../../core/models/lesson.model';
import { CourseService } from '../../../core/services/course.service';
import { CourseCategoryService } from '../../../core/services/course-category.service';
import { ChapterService } from '../../../core/services/chapter.service';
import { LessonService } from '../../../core/services/lesson.service';
import { SafePipe } from '../../../core/pipes/safe.pipe';

@Component({
  selector: 'app-course-view',
  standalone: true,
  imports: [CommonModule, SafePipe],
  templateUrl: './course-view.component.html',
  styleUrls: ['./course-view.component.scss']
})
export class CourseViewComponent implements OnInit {
  course: Course | null = null;
  categories: CourseCategory[] = [];
  chapters: Chapter[] = [];
  chapterLessons: Map<number, Lesson[]> = new Map();
  expandedChapters: Set<number> = new Set();
  selectedLesson: Lesson | null = null;
  showLessonModal = false;
  loading = false;
  courseId: number = 0;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private courseService: CourseService,
    private categoryService: CourseCategoryService,
    private chapterService: ChapterService,
    private lessonService: LessonService
  ) {}

  ngOnInit(): void {
    this.courseId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.courseId) {
      this.loadCourse();
      this.loadCategories();
      this.loadPublishedChapters();
    }
  }

  loadCourse(): void {
    this.loading = true;
    this.courseService.getCourseById(this.courseId).subscribe({
      next: (course) => {
        this.course = course;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading course:', error);
        this.loading = false;
      }
    });
  }

  loadPublishedChapters(): void {
    this.chapterService.getChaptersByCourse(this.courseId).subscribe({
      next: (chapters) => {
        // Filter only published chapters
        this.chapters = chapters
          .filter(chapter => chapter.isPublished)
          .sort((a, b) => a.orderIndex - b.orderIndex);
        
        // Load published lessons for each published chapter
        this.chapters.forEach(chapter => {
          if (chapter.id) {
            this.loadPublishedLessonsForChapter(chapter.id);
          }
        });
      },
      error: (error) => {
        console.error('Error loading chapters:', error);
      }
    });
  }

  loadPublishedLessonsForChapter(chapterId: number): void {
    this.lessonService.getPublishedLessonsByChapter(chapterId).subscribe({
      next: (lessons) => {
        this.chapterLessons.set(chapterId, lessons.sort((a, b) => a.orderIndex - b.orderIndex));
      },
      error: (error) => {
        console.error('Error loading lessons for chapter:', error);
      }
    });
  }

  getLessonsForChapter(chapterId: number | undefined): Lesson[] {
    if (!chapterId) return [];
    return this.chapterLessons.get(chapterId) || [];
  }

  toggleChapter(chapterId: number | undefined): void {
    if (!chapterId) return;
    
    if (this.expandedChapters.has(chapterId)) {
      this.expandedChapters.delete(chapterId);
    } else {
      this.expandedChapters.add(chapterId);
    }
  }

  isChapterExpanded(chapterId: number | undefined): boolean {
    if (!chapterId) return false;
    return this.expandedChapters.has(chapterId);
  }

  openLessonModal(lesson: Lesson): void {
    this.selectedLesson = lesson;
    this.showLessonModal = true;
  }

  closeLessonModal(): void {
    this.showLessonModal = false;
    this.selectedLesson = null;
  }

  getContentUrl(url: string | undefined): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:8088/api${url}`;
  }

  isVideoLesson(): boolean {
    return this.selectedLesson?.lessonType === 'VIDEO';
  }

  isTextLesson(): boolean {
    return this.selectedLesson?.lessonType === 'TEXT';
  }

  isDocumentLesson(): boolean {
    return this.selectedLesson?.lessonType === 'DOCUMENT';
  }

  getThumbnailUrl(thumbnailUrl: string | undefined): string {
    if (!thumbnailUrl) return '';
    if (thumbnailUrl.startsWith('http')) return thumbnailUrl;
    return `http://localhost:8088/api${thumbnailUrl}`;
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

  goBack(): void {
    this.router.navigate(['/tutor-panel/courses']);
  }

  editCourse(): void {
    this.router.navigate(['/tutor-panel/courses/edit', this.courseId]);
  }

  manageContent(): void {
    this.router.navigate(['/tutor-panel/courses', this.courseId, 'chapters']);
  }

  getCategoryIcon(categoryName: string): string {
    const category = this.categories.find(c => c.name === categoryName);
    return category?.icon || '📚';
  }

  getCategoryColor(categoryName: string): string {
    const category = this.categories.find(c => c.name === categoryName);
    return category?.color || '#3B82F6';
  }

  getStatusColor(status: CourseStatus): string {
    switch (status) {
      case CourseStatus.PUBLISHED:
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case CourseStatus.DRAFT:
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case CourseStatus.ARCHIVED:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    }
  }
}
