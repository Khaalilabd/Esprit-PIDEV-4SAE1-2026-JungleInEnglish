import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CourseService } from '../../../core/services/course.service';
import { ChapterService } from '../../../core/services/chapter.service';
import { LessonService } from '../../../core/services/lesson.service';
import { Course, CourseStatus } from '../../../core/models/course.model';
import { Chapter } from '../../../core/models/chapter.model';
import { Lesson } from '../../../core/models/lesson.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-course-status-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './course-status-management.component.html',
  styleUrls: ['./course-status-management.component.scss']
})
export class CourseStatusManagementComponent implements OnInit {
  courses: Course[] = [];
  filteredCourses: Course[] = [];
  selectedCourse: Course | null = null;
  chapters: Chapter[] = [];
  lessons: Map<number, Lesson[]> = new Map();
  
  searchTerm: string = '';
  statusFilter: string = 'ALL';
  loading: boolean = false;
  expandedChapters: Set<number> = new Set();
  
  // Expose CourseStatus enum to template
  CourseStatus = CourseStatus;
  
  // Lesson preview
  previewLesson: Lesson | null = null;
  showPreviewModal: boolean = false;
  
  // Stats
  stats = {
    total: 0,
    published: 0,
    draft: 0,
    archived: 0
  };

  constructor(
    private courseService: CourseService,
    private chapterService: ChapterService,
    private lessonService: LessonService
  ) {}

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    this.loading = true;
    this.courseService.getAllCourses().subscribe({
      next: (courses) => {
        this.courses = courses;
        this.filteredCourses = courses;
        this.calculateStats();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading courses:', error);
        this.loading = false;
        Swal.fire('Error', 'Failed to load courses', 'error');
      }
    });
  }

  calculateStats(): void {
    this.stats.total = this.courses.length;
    this.stats.published = this.courses.filter(c => c.status === CourseStatus.PUBLISHED).length;
    this.stats.draft = this.courses.filter(c => c.status === CourseStatus.DRAFT).length;
    this.stats.archived = this.courses.filter(c => c.status === CourseStatus.ARCHIVED).length;
  }

  filterCourses(): void {
    let filtered = this.courses;

    // Filter by search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(term) ||
        course.description?.toLowerCase().includes(term) ||
        course.category?.toLowerCase().includes(term)
      );
    }

    // Filter by status
    if (this.statusFilter !== 'ALL') {
      filtered = filtered.filter(course => course.status === this.statusFilter);
    }

    this.filteredCourses = filtered;
  }

  selectCourse(course: Course): void {
    this.selectedCourse = course;
    this.loadCourseDetails(course.id!);
  }

  loadCourseDetails(courseId: number): void {
    this.loading = true;
    this.chapterService.getChaptersByCourse(courseId).subscribe({
      next: (chapters) => {
        this.chapters = chapters;
        // Load lessons for each chapter
        chapters.forEach(chapter => {
          this.loadChapterLessons(chapter.id!);
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading chapters:', error);
        this.loading = false;
      }
    });
  }

  loadChapterLessons(chapterId: number): void {
    this.lessonService.getLessonsByChapter(chapterId).subscribe({
      next: (lessons) => {
        this.lessons.set(chapterId, lessons);
      },
      error: (error) => {
        console.error('Error loading lessons:', error);
      }
    });
  }

  toggleChapter(chapterId: number): void {
    if (this.expandedChapters.has(chapterId)) {
      this.expandedChapters.delete(chapterId);
    } else {
      this.expandedChapters.add(chapterId);
    }
  }

  isChapterExpanded(chapterId: number): boolean {
    return this.expandedChapters.has(chapterId);
  }

  updateCourseStatus(course: Course, newStatus: CourseStatus): void {
    // FIX 3: Handle cascade publishing/unpublishing
    if (newStatus === CourseStatus.PUBLISHED) {
      // Show confirmation for publishing
      Swal.fire({
        title: 'Publish Course?',
        html: 'Publishing this course will also publish <strong>ALL its chapters and lessons</strong>.<br>Students will be able to see this content.<br><br>Continue?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10B981',
        cancelButtonColor: '#6B7280',
        confirmButtonText: 'Yes, publish all!',
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          this.performCascadePublish(course);
        }
      });
    } else if (newStatus === CourseStatus.ARCHIVED) {
      // Show confirmation for archiving
      Swal.fire({
        title: 'Archive Course?',
        html: 'Archiving this course will also <strong>hide ALL its chapters and lessons</strong> from students.<br><br>Continue?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EF4444',
        cancelButtonColor: '#6B7280',
        confirmButtonText: 'Yes, archive it!',
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          this.performCascadeArchive(course);
        }
      });
    } else {
      // DRAFT - no cascade, just update course status
      this.performStatusUpdate(course, newStatus);
    }
  }

  // FIX 3: Cascade publish course + chapters + lessons
  private performCascadePublish(course: Course): void {
    this.loading = true;
    const updatedCourse = { ...course, status: CourseStatus.PUBLISHED };
    
    this.courseService.updateCourse(course.id!, updatedCourse).subscribe({
      next: () => {
        // Course updated, now publish all chapters
        this.chapterService.publishAllChaptersByCourse(course.id!).subscribe({
          next: () => {
            // Chapters published, now publish all lessons
            this.lessonService.publishAllLessonsByCourse(course.id!).subscribe({
              next: () => {
                course.status = CourseStatus.PUBLISHED;
                this.calculateStats();
                this.loading = false;
                
                Swal.fire({
                  icon: 'success',
                  title: 'Published!',
                  text: 'Course, chapters and lessons published successfully',
                  timer: 2000,
                  showConfirmButton: false
                });
                
                // Reload course details if viewing
                if (this.selectedCourse?.id === course.id) {
                  this.loadCourseDetails(course.id!);
                }
              },
              error: (error) => {
                console.error('Error publishing lessons:', error);
                this.loading = false;
                Swal.fire('Error', 'Failed to publish lessons', 'error');
              }
            });
          },
          error: (error) => {
            console.error('Error publishing chapters:', error);
            this.loading = false;
            Swal.fire('Error', 'Failed to publish chapters', 'error');
          }
        });
      },
      error: (error) => {
        console.error('Error updating course:', error);
        this.loading = false;
        Swal.fire('Error', 'Failed to update course status', 'error');
      }
    });
  }

  // FIX 3: Cascade archive course + unpublish chapters + lessons
  private performCascadeArchive(course: Course): void {
    this.loading = true;
    const updatedCourse = { ...course, status: CourseStatus.ARCHIVED };
    
    this.courseService.updateCourse(course.id!, updatedCourse).subscribe({
      next: () => {
        // Course archived, now unpublish all chapters
        this.chapterService.unpublishAllChaptersByCourse(course.id!).subscribe({
          next: () => {
            // Chapters unpublished, now unpublish all lessons
            this.lessonService.unpublishAllLessonsByCourse(course.id!).subscribe({
              next: () => {
                course.status = CourseStatus.ARCHIVED;
                this.calculateStats();
                this.loading = false;
                
                Swal.fire({
                  icon: 'success',
                  title: 'Archived!',
                  text: 'Course archived and hidden from students',
                  timer: 2000,
                  showConfirmButton: false
                });
                
                // Reload course details if viewing
                if (this.selectedCourse?.id === course.id) {
                  this.loadCourseDetails(course.id!);
                }
              },
              error: (error) => {
                console.error('Error unpublishing lessons:', error);
                this.loading = false;
                Swal.fire('Error', 'Failed to unpublish lessons', 'error');
              }
            });
          },
          error: (error) => {
            console.error('Error unpublishing chapters:', error);
            this.loading = false;
            Swal.fire('Error', 'Failed to unpublish chapters', 'error');
          }
        });
      },
      error: (error) => {
        console.error('Error updating course:', error);
        this.loading = false;
        Swal.fire('Error', 'Failed to update course status', 'error');
      }
    });
  }

  private performStatusUpdate(course: Course, newStatus: CourseStatus): void {
    const updatedCourse = { ...course, status: newStatus };
    this.courseService.updateCourse(course.id!, updatedCourse).subscribe({
      next: () => {
        course.status = newStatus;
        this.calculateStats();
        
        // Show toast notification
        const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });
        
        Toast.fire({
          icon: 'success',
          title: `Course ${newStatus.toLowerCase()}`
        });
      },
      error: (error) => {
        console.error('Error updating course:', error);
        Swal.fire('Error', 'Failed to update course status', 'error');
      }
    });
  }

  updateChapterStatus(chapter: Chapter, newStatus: boolean): void {
    const updatedChapter = { ...chapter, isPublished: newStatus };
    this.chapterService.updateChapter(chapter.id!, updatedChapter).subscribe({
      next: () => {
        chapter.isPublished = newStatus;
        
        // Show toast notification
        const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });
        
        Toast.fire({
          icon: 'success',
          title: `Chapter ${newStatus ? 'published' : 'set as draft'}`
        });
      },
      error: (error) => {
        console.error('Error updating chapter:', error);
        Swal.fire('Error', 'Failed to update chapter status', 'error');
      }
    });
  }

  updateLessonStatus(lesson: Lesson, newStatus: boolean): void {
    const updatedLesson = { ...lesson, isPublished: newStatus };
    this.lessonService.updateLesson(lesson.id!, updatedLesson).subscribe({
      next: () => {
        lesson.isPublished = newStatus;
        
        // Show toast notification
        const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });
        
        Toast.fire({
          icon: 'success',
          title: `Lesson ${newStatus ? 'published' : 'set as draft'}`
        });
      },
      error: (error) => {
        console.error('Error updating lesson:', error);
        Swal.fire('Error', 'Failed to update lesson status', 'error');
      }
    });
  }

  backToList(): void {
    this.selectedCourse = null;
    this.chapters = [];
    this.lessons.clear();
    this.expandedChapters.clear();
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PUBLISHED': return 'badge-published';
      case 'DRAFT': return 'badge-draft';
      case 'ARCHIVED': return 'badge-archived';
      default: return 'badge-default';
    }
  }

  getLessonTypeIcon(type: string): string {
    switch (type) {
      case 'VIDEO': return 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'TEXT': return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
      case 'QUIZ': return 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'ASSIGNMENT': return 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01';
      case 'DOCUMENT': return 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z';
      default: return 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253';
    }
  }

  getLessonTypeColor(type: string): string {
    switch (type) {
      case 'VIDEO': return 'text-red-500';
      case 'TEXT': return 'text-blue-500';
      case 'QUIZ': return 'text-purple-500';
      case 'ASSIGNMENT': return 'text-orange-500';
      case 'DOCUMENT': return 'text-green-500';
      default: return 'text-gray-500';
    }
  }

  openLessonPreview(lesson: Lesson): void {
    this.previewLesson = lesson;
    this.showPreviewModal = true;
  }

  closePreviewModal(): void {
    this.showPreviewModal = false;
    this.previewLesson = null;
  }

  getCategoryIcon(category: string): string {
    // Map category names to emojis
    const categoryIcons: { [key: string]: string } = {
      'Grammar': '📝',
      'Vocabulary': '📚',
      'Speaking': '🗣️',
      'Listening': '👂',
      'Reading': '📖',
      'Writing': '✍️',
      'Pronunciation': '🔊',
      'Business English': '💼',
      'IELTS': '🎓',
      'TOEFL': '📜',
      'Conversation': '💬',
      'Kids English': '👶',
      'Advanced': '🚀',
      'Beginner': '🌱'
    };
    return categoryIcons[category] || '📚';
  }
}
