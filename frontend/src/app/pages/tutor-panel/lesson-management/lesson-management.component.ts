import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { EditorModule } from '@tinymce/tinymce-angular';
import { LessonService } from '../../../core/services/lesson.service';
import { ChapterService } from '../../../core/services/chapter.service';
import { CourseService } from '../../../core/services/course.service';
import { Lesson, LessonType, CreateLessonRequest, UpdateLessonRequest } from '../../../core/models/lesson.model';
import { Chapter } from '../../../core/models/chapter.model';
import { Course } from '../../../core/models/course.model';
import * as mammoth from 'mammoth';

@Component({
  selector: 'app-lesson-management',
  standalone: true,
  imports: [CommonModule, FormsModule, EditorModule],
  templateUrl: './lesson-management.component.html',
  styleUrl: './lesson-management.component.scss'
})
export class LessonManagementComponent implements OnInit {
  courseId!: number;
  chapterId!: number;
  course: Course | null = null;
  chapter: Chapter | null = null;
  lessons: Lesson[] = [];
  loading = false;
  
  // Modal states
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showPreviewModal = false;
  
  // Lesson types
  lessonTypes = Object.values(LessonType);
  LessonType = LessonType;
  
  // TinyMCE configuration with free plugins only
  tinyMceConfig = {
    plugins: [
      'anchor', 'autolink', 'charmap', 'codesample', 'emoticons', 
      'image', 'link', 'lists', 'media', 'searchreplace', 
      'table', 'visualblocks', 'wordcount', 'code',
      'fullscreen', 'help', 'insertdatetime', 'preview'
    ],
    toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align | numlist bullist indent outdent | emoticons charmap | searchreplace | code fullscreen preview | help',
    height: 400,
    menubar: false,
    branding: false,
    resize: false
  };
  
  // Form data
  lessonForm: CreateLessonRequest = {
    title: '',
    description: '',
    content: '',
    contentUrl: '',
    lessonType: LessonType.TEXT,
    orderIndex: 0,
    duration: 0,
    isPreview: false,
    isPublished: false,
    chapterId: 0
  };
  
  selectedLesson: Lesson | null = null;
  selectedFile: File | null = null;
  uploadProgress = 0;
  uploadingFile = false;
  previewVideoUrl: any = null;
  filePreviewUrl: any = null;

  // Document conversion properties
  convertingDocument = false;
  conversionError: string | null = null;
  convertedFileName: string | null = null;
  showEditor = false;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private lessonService: LessonService,
    private chapterService: ChapterService,
    private courseService: CourseService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.courseId = Number(this.route.snapshot.paramMap.get('courseId'));
    this.chapterId = Number(this.route.snapshot.paramMap.get('chapterId'));
    this.lessonForm.chapterId = this.chapterId;
    this.loadCourse();
    this.loadChapter();
    this.loadLessons();
  }

  loadCourse(): void {
    this.courseService.getCourseById(this.courseId).subscribe({
      next: (course) => {
        this.course = course;
      },
      error: (error) => {
        console.error('Error loading course:', error);
      }
    });
  }

  loadChapter(): void {
    this.chapterService.getChapterById(this.chapterId).subscribe({
      next: (chapter) => {
        this.chapter = chapter;
      },
      error: (error) => {
        console.error('Error loading chapter:', error);
      }
    });
  }

  loadLessons(): void {
    this.loading = true;
    this.lessonService.getLessonsByChapter(this.chapterId).subscribe({
      next: (lessons) => {
        this.lessons = lessons.sort((a, b) => a.orderIndex - b.orderIndex);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading lessons:', error);
        this.loading = false;
      }
    });
  }

  openCreateModal(): void {
    this.lessonForm = {
      title: '',
      description: '',
      content: '',
      contentUrl: '',
      lessonType: LessonType.TEXT,
      orderIndex: this.lessons.length,
      duration: 0,
      isPreview: false,
      isPublished: false,
      chapterId: this.chapterId
    };
    this.selectedFile = null;
    this.showCreateModal = true;
  }

  openEditModal(lesson: Lesson): void {
    this.selectedLesson = lesson;
    this.lessonForm = {
      title: lesson.title,
      description: lesson.description,
      content: lesson.content || '',
      contentUrl: lesson.contentUrl || '',
      lessonType: lesson.lessonType,
      orderIndex: lesson.orderIndex,
      duration: lesson.duration || 0,
      isPreview: lesson.isPreview,
      isPublished: lesson.isPublished,
      chapterId: lesson.chapterId
    };
    this.selectedFile = null;
    
    // For DOCUMENT type lessons, if there's HTML content, show the editor
    if (lesson.lessonType === LessonType.DOCUMENT && lesson.content && lesson.content.trim().length > 0) {
      this.showEditor = true;
      this.convertedFileName = lesson.title || 'document';
    } else {
      this.showEditor = false;
      this.convertedFileName = null;
    }
    
    this.showEditModal = true;
  }

  openDeleteModal(lesson: Lesson): void {
    this.selectedLesson = lesson;
    this.showDeleteModal = true;
  }

  openPreviewModal(lesson: Lesson): void {
    this.selectedLesson = lesson;
    this.previewVideoUrl = null;
    
    // Process video URL if it's a video lesson
    if (lesson.lessonType === LessonType.VIDEO && lesson.contentUrl) {
      if (lesson.contentUrl.includes('youtube') || lesson.contentUrl.includes('youtu.be') || lesson.contentUrl.includes('vimeo')) {
        this.previewVideoUrl = this.getEmbedUrl(lesson.contentUrl);
      }
    }
    
    this.showPreviewModal = true;
  }

  getEmbedUrl(url: string): SafeResourceUrl {
    let embedUrl = url;
    
    // Convert YouTube URLs to embed format
    if (url.includes('youtube.com/watch')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }
    // Convert Vimeo URLs to embed format
    else if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      embedUrl = `https://player.vimeo.com/video/${videoId}`;
    }
    
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  getDocumentPreviewUrl(contentUrl: string): SafeResourceUrl {
    const cleanUrl = contentUrl.startsWith('/') ? contentUrl.substring(1) : contentUrl;
    const url = `http://localhost:8086/${cleanUrl}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  getDocumentDownloadUrl(contentUrl: string): string {
    const cleanUrl = contentUrl.startsWith('/') ? contentUrl.substring(1) : contentUrl;
    return `http://localhost:8086/${cleanUrl}`;
  }

  closeModals(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.showPreviewModal = false;
    this.selectedLesson = null;
    this.selectedFile = null;
    this.previewVideoUrl = null;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      
      // Handle document conversion for DOCUMENT type lessons
      if (this.lessonForm.lessonType === LessonType.DOCUMENT) {
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        
        if (fileExtension === 'pdf' || fileExtension === 'docx') {
          this.convertDocumentToHtml(file);
          return;
        } else {
          this.conversionError = 'Only PDF and DOCX files can be converted to editable content. Other file types will be uploaded as downloadable documents.';
        }
      }
      
      // Create preview URL for the file
      if (file.type.startsWith('video/')) {
        this.filePreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(file));
      } else if (file.type === 'application/pdf') {
        this.filePreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(file));
      } else {
        this.filePreviewUrl = null;
      }
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    this.uploadProgress = 0;
    this.filePreviewUrl = null;
  }

  getAcceptedFileTypes(): string {
    switch (this.lessonForm.lessonType) {
      case LessonType.VIDEO:
        return 'video/*';
      case LessonType.DOCUMENT:
        return '.docx';
      default:
        return '*';
    }
  }

  getFileIcon(): string {
    if (!this.selectedFile) return '';
    
    const type = this.selectedFile.type;
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('image/')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('sheet') || type.includes('excel')) return '📊';
    if (type.includes('presentation') || type.includes('powerpoint')) return '📊';
    return '📁';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  async convertDocumentToHtml(file: File): Promise<void> {
    this.convertingDocument = true;
    this.conversionError = null;
    this.convertedFileName = file.name;

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'docx') {
        await this.convertWordToHtml(file);
        this.showEditor = true;
      } else {
        this.conversionError = 'Only DOCX files are supported. Please upload a .docx file.';
      }
    } catch (error) {
      console.error('Conversion error:', error);
      this.conversionError = 'Failed to convert document. Please try again or upload a different file.';
    } finally {
      this.convertingDocument = false;
    }
  }

  private async convertWordToHtml(file: File): Promise<void> {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    this.lessonForm.content = result.value;
    // Clear contentUrl since we're using HTML content instead
    this.lessonForm.contentUrl = '';
    
    if (result.messages.length > 0) {
      console.warn('Conversion warnings:', result.messages);
    }
  }

  changeFile(): void {
    this.showEditor = false;
    this.convertedFileName = null;
    this.lessonForm.content = '';
    this.selectedFile = null;
    this.conversionError = null;
  }

  // FIX 3: Publish validation method
  canPublish(lesson: any): boolean {
    switch (lesson.lessonType) {
      case LessonType.VIDEO:
        return !!(lesson.contentUrl && lesson.contentUrl.trim().length > 0);
      case LessonType.DOCUMENT:
        return !!(
          (lesson.contentUrl && lesson.contentUrl.trim().length > 0) ||
          (lesson.content && lesson.content.trim().length > 0)
        );
      case LessonType.TEXT:
        return !!(lesson.content && lesson.content.trim().length > 0);
      case LessonType.QUIZ:
        return false; // Quiz builder not implemented yet
      case LessonType.ASSIGNMENT:
        return !!(
          (lesson.content && lesson.content.trim().length > 0) ||
          (lesson.contentUrl && lesson.contentUrl.trim().length > 0)
        );
      case LessonType.INTERACTIVE:
        return !!(lesson.contentUrl && lesson.contentUrl.trim().length > 0);
      default:
        return false;
    }
  }

  getPublishTooltip(lesson: any): string {
    if (lesson.lessonType === LessonType.QUIZ) {
      return 'Quiz builder coming soon - cannot publish yet';
    }
    return 'Add content before publishing';
  }

  // Helper methods for template null checking
  hasDocumentContent(lesson: any): boolean {
    return lesson?.content && lesson.content.trim().length > 0;
  }

  hasNoDocumentContent(lesson: any): boolean {
    return !lesson?.content || lesson.content.trim().length === 0;
  }

  getDocumentContent(lesson: any): string {
    return lesson?.content || '';
  }

  createLesson(): void {
    if (!this.lessonForm.title || !this.lessonForm.description) {
      alert('Please fill in all required fields');
      return;
    }

    console.log('Creating lesson with data:', this.lessonForm);
    this.loading = true;
    
    // For DOCUMENT type lessons that have been converted to HTML, don't upload the file
    const shouldUploadFile = this.selectedFile && 
      !(this.lessonForm.lessonType === LessonType.DOCUMENT && this.showEditor && this.lessonForm.content);
    
    // First create the lesson
    this.lessonService.createLesson(this.lessonForm).subscribe({
      next: (createdLesson) => {
        // If there's a file to upload and it's not a converted document, upload it
        if (shouldUploadFile && createdLesson.id) {
          this.uploadingFile = true;
          const uploadObservable = this.lessonForm.lessonType === LessonType.VIDEO
            ? this.lessonService.uploadVideo(createdLesson.id, this.selectedFile!)
            : this.lessonService.uploadDocument(createdLesson.id, this.selectedFile!);
          
          uploadObservable.subscribe({
            next: (response) => {
              this.uploadingFile = false;
              this.uploadProgress = 100;
              console.log('File uploaded successfully:', response.message);
              this.loadLessons();
              this.closeModals();
              this.loading = false;
            },
            error: (error) => {
              this.uploadingFile = false;
              console.error('Error uploading file:', error);
              alert('Lesson created but file upload failed: ' + (error.error?.error || 'Unknown error'));
              this.loadLessons();
              this.closeModals();
              this.loading = false;
            }
          });
        } else {
          // No file to upload, just reload
          this.loadLessons();
          this.closeModals();
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error creating lesson:', error);
        alert('Error creating lesson: ' + (error.error?.message || 'Unknown error'));
        this.loading = false;
      }
    });
  }

  updateLesson(): void {
      if (!this.selectedLesson?.id) return;

      if (!this.lessonForm.title || !this.lessonForm.description) {
        alert('Please fill in all required fields');
        return;
      }

      this.loading = true;
      const updateRequest: UpdateLessonRequest = {
        title: this.lessonForm.title,
        description: this.lessonForm.description,
        content: this.lessonForm.content,
        contentUrl: this.lessonForm.contentUrl,
        lessonType: this.lessonForm.lessonType,
        orderIndex: this.lessonForm.orderIndex,
        duration: this.lessonForm.duration,
        isPreview: this.lessonForm.isPreview,
        isPublished: this.lessonForm.isPublished,
        chapterId: this.chapterId
      };

      // FIX 1: Check if we need to replace existing file
      const hasExistingFile = this.selectedLesson.contentUrl && this.selectedLesson.contentUrl.trim().length > 0;
      const hasNewFile = this.selectedFile !== null;

      if (hasExistingFile && hasNewFile) {
        // Confirm file replacement
        const confirmed = confirm('This will replace the existing file. Continue?');
        if (!confirmed) {
          // User cancelled - clear selected file and keep existing
          this.selectedFile = null;
          this.loading = false;
          return;
        }

        // Delete old file first
        this.lessonService.deleteContentFile(this.selectedLesson.id).subscribe({
          next: () => {
            console.log('Old file deleted successfully');
            // Now proceed with update and new file upload
            this.proceedWithUpdate(updateRequest);
          },
          error: (error) => {
            console.error('Error deleting old file:', error);
            alert('Failed to delete old file. Please try again.');
            this.loading = false;
          }
        });
      } else {
        // No file replacement needed, proceed normally
        this.proceedWithUpdate(updateRequest);
      }
    }

    private proceedWithUpdate(updateRequest: UpdateLessonRequest): void {
      if (!this.selectedLesson?.id) return;

      // For DOCUMENT type lessons that have been converted to HTML, don't upload the file
      const shouldUploadFile = this.selectedFile && 
        !(this.lessonForm.lessonType === LessonType.DOCUMENT && this.showEditor && this.lessonForm.content);

      // First update the lesson
      this.lessonService.updateLesson(this.selectedLesson.id, updateRequest).subscribe({
        next: (updatedLesson) => {
          // If there's a new file to upload and it's not a converted document, upload it
          if (shouldUploadFile && updatedLesson.id) {
            this.uploadingFile = true;
            const uploadObservable = this.lessonForm.lessonType === LessonType.VIDEO
              ? this.lessonService.uploadVideo(updatedLesson.id, this.selectedFile!)
              : this.lessonService.uploadDocument(updatedLesson.id, this.selectedFile!);

            uploadObservable.subscribe({
              next: (response) => {
                this.uploadingFile = false;
                this.uploadProgress = 100;
                console.log('File uploaded successfully:', response.message);
                this.loadLessons();
                this.closeModals();
                this.loading = false;
              },
              error: (error) => {
                this.uploadingFile = false;
                console.error('Error uploading file:', error);
                alert('Lesson updated but file upload failed: ' + (error.error?.error || 'Unknown error'));
                this.loadLessons();
                this.closeModals();
                this.loading = false;
              }
            });
          } else {
            // No file to upload, just reload
            this.loadLessons();
            this.closeModals();
            this.loading = false;
          }
        },
        error: (error) => {
          console.error('Error updating lesson:', error);
          alert('Error updating lesson: ' + (error.error?.message || 'Unknown error'));
          this.loading = false;
        }
      });
    }


  deleteLesson(): void {
    if (!this.selectedLesson?.id) return;
    
    this.loading = true;
    this.lessonService.deleteLesson(this.selectedLesson.id).subscribe({
      next: () => {
        this.loadLessons();
        this.closeModals();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error deleting lesson:', error);
        this.loading = false;
      }
    });
  }

  togglePublish(lesson: Lesson): void {
    if (!lesson.id) return;
    
    const updateRequest: UpdateLessonRequest = {
      title: lesson.title,
      description: lesson.description,
      content: lesson.content,
      contentUrl: lesson.contentUrl,
      lessonType: lesson.lessonType,
      orderIndex: lesson.orderIndex,
      duration: lesson.duration,
      isPreview: lesson.isPreview,
      isPublished: !lesson.isPublished,
      chapterId: lesson.chapterId
    };
    
    this.lessonService.updateLesson(lesson.id, updateRequest).subscribe({
      next: () => {
        this.loadLessons();
      },
      error: (error) => {
        console.error('Error toggling publish status:', error);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/tutor-panel/courses', this.courseId, 'chapters']);
  }

  getTotalDuration(): number {
    return this.lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0);
  }

  getPublishedCount(): number {
    return this.lessons.filter(lesson => lesson.isPublished).length;
  }

  getPreviewCount(): number {
    return this.lessons.filter(lesson => lesson.isPreview).length;
  }

  getLessonTypeIcon(type: LessonType): string {
    const icons = {
      [LessonType.VIDEO]: '🎥',
      [LessonType.TEXT]: '📄',
      [LessonType.DOCUMENT]: '📁',
      [LessonType.QUIZ]: '❓',
      [LessonType.ASSIGNMENT]: '📝',
      [LessonType.INTERACTIVE]: '🎮'
    };
    return icons[type] || '📚';
  }

  getLessonTypeColor(type: LessonType): string {
    const colors = {
      [LessonType.VIDEO]: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      [LessonType.TEXT]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      [LessonType.DOCUMENT]: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      [LessonType.QUIZ]: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
      [LessonType.ASSIGNMENT]: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
      [LessonType.INTERACTIVE]: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  }

}
