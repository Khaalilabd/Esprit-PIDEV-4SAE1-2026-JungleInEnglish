import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { QuillEditorComponent } from 'ngx-quill';
import { ForumService, Topic, CreateTopicRequest, SubCategory } from '../../../../services/forum.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ClubService } from '../../../../core/services/club.service';
import Swal from 'sweetalert2';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-topic-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, QuillEditorComponent],
  templateUrl: './topic-list.component.html',
  styleUrl: './topic-list.component.scss'
})
export class TopicListComponent implements OnInit {
  topics: Topic[] = [];
  subCategoryId!: number;
  subCategoryName = '';
  subCategory: SubCategory | null = null;
  loading = true;
  error: string | null = null;
  canCreateTopic = false;
  isReviewCategory = false; // Pour détecter si c'est Event Feedback & Reviews
  isAnnouncementCategory = false; // Pour détecter si c'est Official Announcements
  isEventHighlightsCategory = false; // Pour détecter si c'est Event Highlights
  isResourceSharingCategory = false; // Pour détecter si c'est Resource Sharing
  isSchoolAnnouncementsCategory = false; // Pour détecter si c'est School Announcements
  isRecruitmentCategory = false; // Pour détecter si c'est Recruitment & Applications
  
  currentPage = 0;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;
  sortBy = 'recent'; // Default sort: recent

  // Modal state
  showNewTopicModal = false;
  showEditTopicModal = false;
  showDeleteConfirmModal = false;
  
  newTopic = {
    title: '',
    content: ''
  };
  
  // Review-specific fields
  rating = 0;
  hoveredRating = 0;
  
  // Event Highlights-specific fields
  selectedPhotos: File[] = [];
  photoPreviewUrls: string[] = [];
  mediaBase64Data: string[] = []; // Store base64 data for backend
  
  // Resource Sharing-specific fields
  resourceType: string = ''; // 'LINK', 'PDF', 'IMAGE', 'VIDEO'
  resourceLink: string = '';
  selectedFile: File | null = null;
  filePreviewUrl: string = '';
  uploadingFile = false;
  
  // Recruitment-specific fields
  recruitmentPosition: string = '';
  recruitmentRequirements: string = '';
  recruitmentDeadline: string = '';
  recruitmentContactInfo: string = '';

  editingTopic: Topic | null = null;
  deletingTopicId: number | null = null;

  private authService = inject(AuthService);
  private clubService = inject(ClubService);
  private cdr = inject(ChangeDetectorRef);

  // Quill editor configuration
  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ]
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private forumService: ForumService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.subCategoryId = +params['subCategoryId'];
      this.subCategoryName = params['subCategoryName'] || 'Subcategory';
      this.loadData();
    });
  }

  loadData(): void {
    this.loading = true;
    this.error = null;
    
    console.log('=== LOADING DATA ===');
    console.log('SubCategory ID:', this.subCategoryId);
    console.log('Current Page:', this.currentPage);
    
    // Load both topics and subcategory details
    forkJoin({
      topics: this.forumService.getTopicsBySubCategory(this.subCategoryId, this.currentPage, this.pageSize, this.sortBy),
      subCategory: this.forumService.getSubCategoryById(this.subCategoryId)
    }).subscribe({
      next: (response) => {
        console.log('=== DATA LOADED ===');
        console.log('Topics received:', response.topics.content);
        console.log('Topics count:', response.topics.content.length);
        console.log('SubCategory:', response.subCategory);
        
        this.topics = [...response.topics.content]; // Create new array reference
        this.totalPages = response.topics.totalPages;
        this.totalElements = response.topics.totalElements;
        this.subCategory = response.subCategory;
        
        // Update subCategoryName with the real name from API
        this.subCategoryName = response.subCategory.name;
        
        // Check if this is the Event Feedback & Reviews category
        this.isReviewCategory = response.subCategory.name === 'Event Feedback & Reviews';
        
        // Check if this is the Official Announcements category
        this.isAnnouncementCategory = response.subCategory.name === 'Official Announcements';
        
        // Check if this is the Event Highlights category
        this.isEventHighlightsCategory = response.subCategory.name === 'Event Highlights';
        
        // Check if this is the Resource Sharing category
        this.isResourceSharingCategory = response.subCategory.name === 'Resource Sharing';
        
        // Check if this is the School Announcements category
        this.isSchoolAnnouncementsCategory = response.subCategory.name === 'School Announcements';
        
        // Check if this is the Recruitment & Applications category
        this.isRecruitmentCategory = response.subCategory.name === 'Recruitment & Applications';
        
        console.log('Is Resource Sharing:', this.isResourceSharingCategory);
        console.log('Topics array after assignment:', this.topics);
        
        // Check if user can create topics
        this.checkCreateTopicPermission();
        
        this.loading = false;
        console.log('Loading finished, topics:', this.topics.length);
        
        // Force change detection
        setTimeout(() => {
          this.cdr.detectChanges();
        }, 0);
      },
      error: (err) => {
        console.error('Error loading data:', err);
        
        // Try to load at least the topics if subcategory fails
        this.forumService.getTopicsBySubCategory(this.subCategoryId, this.currentPage, this.pageSize, this.sortBy).subscribe({
          next: (response) => {
            this.topics = response.content;
            this.totalPages = response.totalPages;
            this.totalElements = response.totalElements;
            
            // Assume no restriction if we can't check
            this.canCreateTopic = true;
            
            this.loading = false;
            this.error = null;
            this.cdr.markForCheck();
          },
          error: () => {
            this.error = 'Error loading data';
            this.loading = false;
            this.cdr.markForCheck();
          }
        });
      }
    });
  }

  checkCreateTopicPermission(): void {
    const currentUser = this.authService.currentUserValue;
    
    if (!currentUser) {
      this.canCreateTopic = false;
      return;
    }
    
    // Use the new permission service
    this.forumService.getPermissions(this.subCategoryId, currentUser.role).subscribe({
      next: (permissions) => {
        this.canCreateTopic = permissions.canCreateTopic;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error checking permissions:', err);
        // Fallback to old logic if permission service fails
        this.checkCreateTopicPermissionFallback();
      }
    });
  }
  
  private checkCreateTopicPermissionFallback(): void {
    const currentUser = this.authService.currentUserValue;
    
    if (!currentUser) {
      this.canCreateTopic = false;
      return;
    }
    
    // Check if subcategory requires admin role (School Announcements)
    if (this.subCategory?.requiresAdminRole) {
      const allowedRoles = ['ADMIN', 'ACADEMIC_OFFICE_AFFAIRS'];
      this.canCreateTopic = allowedRoles.includes(currentUser.role);
      this.cdr.markForCheck();
      return;
    }
    
    // If subcategory doesn't require club membership, everyone can post
    if (!this.subCategory?.requiresClubMembership) {
      this.canCreateTopic = true;
      return;
    }
    
    // Check if user has club membership with valid role
    this.clubService.getUserMemberships(currentUser.id).subscribe({
      next: (memberships) => {
        const allowedRoles = ['PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY', 'TREASURER', 
                             'COMMUNICATION_MANAGER', 'EVENT_MANAGER', 'PARTNERSHIP_MANAGER', 'MEMBER'];
        
        this.canCreateTopic = memberships.some(m => allowedRoles.includes(m.rank));
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error checking club membership:', err);
        this.canCreateTopic = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadTopics(): void {
    this.loading = true;
    this.error = null;
    
    this.forumService.getTopicsBySubCategory(this.subCategoryId, this.currentPage, this.pageSize, this.sortBy).subscribe({
      next: (response) => {
        this.topics = response.content;
        this.totalPages = response.totalPages;
        this.totalElements = response.totalElements;
        this.loading = false;
        this.cdr.markForCheck(); // Trigger change detection
      },
      error: (err) => {
        console.error('Error loading topics:', err);
        this.error = 'Error loading topics';
        this.loading = false;
        this.cdr.markForCheck(); // Trigger change detection
      }
    });
  }

  openNewTopicModal(): void {
    this.showNewTopicModal = true;
    this.resetForm();
  }

  closeNewTopicModal(): void {
    this.showNewTopicModal = false;
    this.resetForm();
  }
  
  setRating(stars: number): void {
    this.rating = stars;
  }
  
  setHoveredRating(stars: number): void {
    this.hoveredRating = stars;
  }
  
  clearHoveredRating(): void {
    this.hoveredRating = 0;
  }
  
  getStarClass(star: number): string {
    const currentRating = this.hoveredRating || this.rating;
    return star <= currentRating ? 'fas fa-star text-yellow-400' : 'far fa-star text-gray-300';
  }

  openEditTopicModal(event: Event, topic: Topic): void {
    event.stopPropagation(); // Empêcher la navigation vers le topic
    this.editingTopic = topic;
    
    // Extract rating from title if it's a review
    if (this.isReviewCategory && topic.title.includes('Star')) {
      const match = topic.title.match(/(\d+)\s+Star/);
      if (match) {
        this.rating = parseInt(match[1], 10);
      }
    }
    
    this.newTopic = {
      title: this.isReviewCategory ? '' : topic.title,
      content: topic.content.startsWith('Rating:') ? '' : topic.content
    };
    
    // Load existing resource if any
    if (topic.resourceType && topic.resourceLink) {
      this.resourceType = topic.resourceType;
      this.resourceLink = topic.resourceLink;
      
      // For images, set the preview URL
      if (topic.resourceType === 'IMAGE') {
        this.filePreviewUrl = 'http://localhost:8080' + topic.resourceLink;
      }
    }
    
    this.showEditTopicModal = true;
  }

  closeEditTopicModal(): void {
    this.showEditTopicModal = false;
    this.editingTopic = null;
    this.resetForm();
  }

  openDeleteConfirmModal(event: Event, topicId: number): void {
    event.stopPropagation(); // Empêcher la navigation vers le topic
    
    Swal.fire({
      title: this.isReviewCategory ? 'Delete Review' : 'Delete Topic',
      text: this.isReviewCategory 
        ? 'Are you sure you want to delete this review? This action cannot be undone.'
        : 'Are you sure you want to delete this topic? All associated replies will also be deleted.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteTopic(topicId);
      }
    });
  }

  closeDeleteConfirmModal(): void {
    this.showDeleteConfirmModal = false;
    this.deletingTopicId = null;
  }

  submitNewTopic(): void {
    if (this.isFormValid()) {
      const currentUser = this.authService.currentUserValue;
      
      if (!currentUser) {
        Swal.fire({
          title: 'Authentication Required',
          text: 'You must be logged in to create a topic',
          icon: 'warning',
          confirmButtonColor: '#dc2626'
        });
        return;
      }

      let title = this.newTopic.title;
      let content = this.newTopic.content;
      
      // Handle Event Highlights with photos
      if (this.isEventHighlightsCategory && this.selectedPhotos.length > 0) {
        this.uploadingFile = true;
        this.uploadEventHighlightPhotos(currentUser, title);
        return;
      }
      
      // Handle file upload or link for all categories
      if (this.resourceType === 'LINK') {
        this.createTopicWithResource(currentUser, title, content, this.resourceType, this.resourceLink);
      } else if (this.selectedFile) {
        this.uploadingFile = true;
        this.forumService.uploadFile(this.selectedFile).subscribe({
          next: (response) => {
            this.uploadingFile = false;
            this.createTopicWithResource(currentUser, title, content, this.resourceType, response.filePath);
          },
          error: (err) => {
            this.uploadingFile = false;
            console.error('Error uploading file:', err);
            Swal.fire({
              title: 'Upload Error',
              text: 'Error uploading file. Please try again.',
              icon: 'error',
              confirmButtonColor: '#dc2626'
            });
          }
        });
        return; // Wait for upload to complete
      } else {
        // Normal topic creation without resource
        this.createTopicWithResource(currentUser, title, content, null, null);
      }
    }
  }
  
  private uploadEventHighlightPhotos(currentUser: any, title: string): void {
    const uploadObservables = this.selectedPhotos.map(photo => 
      this.forumService.uploadFile(photo)
    );
    
    // Upload all photos in parallel
    forkJoin(uploadObservables).subscribe({
      next: (responses) => {
        this.uploadingFile = false;
        
        // Create media array with uploaded file paths
        const mediaArray = responses.map((response, index) => ({
          type: this.selectedPhotos[index].type.startsWith('video') ? 'video' : 'image',
          data: response.filePath,
          name: this.selectedPhotos[index].name
        }));
        
        // Store as JSON in content with special marker
        const mediaString = mediaArray.map(m => JSON.stringify(m)).join('[MEDIA_SEPARATOR]');
        
        // Add description if provided
        let content = `[EVENT_HIGHLIGHT_MEDIA]${mediaString}`;
        if (this.newTopic.content.trim()) {
          content += `[DESCRIPTION]${this.newTopic.content.trim()}`;
        }
        
        this.createTopicWithResource(currentUser, title, content, null, null);
      },
      error: (err) => {
        this.uploadingFile = false;
        console.error('Error uploading photos:', err);
        Swal.fire({
          title: 'Upload Error',
          text: 'Error uploading photos. Please try again.',
          icon: 'error',
          confirmButtonColor: '#dc2626'
        });
      }
    });
  }
  
  private createTopicWithResource(currentUser: any, title: string, content: string, resourceType: string | null, resourceLink: string | null): void {
    const request: CreateTopicRequest = {
      subCategoryId: this.subCategoryId,
      title: title,
      content: content || undefined, // Send undefined instead of empty string
      userId: currentUser.id,
      userName: currentUser.firstName + ' ' + currentUser.lastName,
      resourceType: resourceType || undefined,
      resourceLink: resourceLink || undefined
    };

    this.forumService.createTopic(request).subscribe({
      next: (topic) => {
        console.log('Topic created:', topic);
        Swal.fire({
          title: 'Success!',
          text: 'Your topic has been created successfully.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        this.closeNewTopicModal();
        this.loadTopics(); // Recharger la liste
        this.cdr.markForCheck(); // Trigger change detection
      },
      error: (err) => {
        console.error('Error creating topic:', err);
        Swal.fire({
          title: 'Error',
          text: 'Error creating topic. Please try again.',
          icon: 'error',
          confirmButtonColor: '#dc2626'
        });
      }
    });
  }

  submitEditTopic(): void {
    if (this.isFormValid() && this.editingTopic) {
      // For review category, use rating as title
      const title = this.isReviewCategory 
        ? `${this.rating} Star${this.rating !== 1 ? 's' : ''} Review`
        : this.newTopic.title;
      
      // For review category, content is optional
      const content = this.isReviewCategory && !this.newTopic.content.trim()
        ? `Rating: ${'⭐'.repeat(this.rating)}`
        : this.newTopic.content;

      // Handle file upload or link
      if (this.resourceType === 'LINK') {
        this.updateTopicWithResource(title, content, this.resourceType, this.resourceLink);
      } else if (this.selectedFile) {
        this.uploadingFile = true;
        this.forumService.uploadFile(this.selectedFile).subscribe({
          next: (response) => {
            this.uploadingFile = false;
            this.updateTopicWithResource(title, content, this.resourceType, response.filePath);
          },
          error: (err) => {
            this.uploadingFile = false;
            console.error('Error uploading file:', err);
            Swal.fire({
              title: 'Upload Error',
              text: 'Error uploading file. Please try again.',
              icon: 'error',
              confirmButtonColor: '#dc2626'
            });
          }
        });
        return; // Wait for upload to complete
      } else {
        // Update without new resource (keep existing or remove)
        this.updateTopicWithResource(title, content, this.resourceType || null, this.resourceLink || null);
      }
    }
  }

  private updateTopicWithResource(title: string, content: string, resourceType: string | null, resourceLink: string | null): void {
    if (!this.editingTopic) return;

    const request: CreateTopicRequest = {
      subCategoryId: this.subCategoryId,
      title: title,
      content: content,
      userId: this.editingTopic.userId,
      userName: this.editingTopic.userName,
      resourceType: resourceType || undefined,
      resourceLink: resourceLink || undefined
    };

    this.forumService.updateTopic(this.editingTopic.id, request).subscribe({
      next: (topic) => {
        console.log('Topic updated:', topic);
        Swal.fire({
          title: 'Success!',
          text: this.isReviewCategory ? 'Your review has been updated successfully.' : 'Your topic has been updated successfully.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        this.closeEditTopicModal();
        this.loadTopics(); // Recharger la liste
      },
      error: (err) => {
        console.error('Error updating topic:', err);
        Swal.fire({
          title: 'Error',
          text: 'Error updating topic',
          icon: 'error',
          confirmButtonColor: '#dc2626'
        });
      }
    });
  }

  confirmDeleteTopic(): void {
    if (this.deletingTopicId) {
      this.forumService.deleteTopic(this.deletingTopicId).subscribe({
        next: () => {
          console.log('Topic deleted');
          this.closeDeleteConfirmModal();
          this.loadTopics(); // Recharger la liste
        },
        error: (err) => {
          console.error('Error deleting topic:', err);
          alert('❌ Error deleting topic');
        }
      });
    }
  }

  deleteTopic(topicId: number): void {
    this.forumService.deleteTopic(topicId).subscribe({
      next: () => {
        Swal.fire({
          title: 'Deleted!',
          text: this.isReviewCategory 
            ? 'The review has been successfully deleted.'
            : 'The topic has been successfully deleted.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        this.loadTopics(); // Recharger la liste
      },
      error: (err) => {
        console.error('Error deleting topic:', err);
        Swal.fire({
          title: 'Error',
          text: this.isReviewCategory ? 'Error deleting review' : 'Error deleting topic',
          icon: 'error',
          confirmButtonColor: '#dc2626'
        });
      }
    });
  }

  canEditOrDelete(topic: Topic): boolean {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return false;
    
    // L'utilisateur peut éditer/supprimer uniquement ses propres topics
    // ou si c'est un admin/modérateur
    return topic.userId === currentUser.id || 
           currentUser.role === 'ADMIN' || 
           currentUser.role === 'MODERATOR';
  }

  isFormValid(): boolean {
    // Title is always required
    if (!this.newTopic.title.trim()) return false;
    
    // For Event Highlights, content is optional but photos are required
    if (this.isEventHighlightsCategory) {
      return this.selectedPhotos.length > 0;
    }
    
    // Content is required for other categories
    if (!this.newTopic.content.trim()) return false;
    
    // If a resource type is selected, validate accordingly
    if (this.resourceType) {
      if (this.resourceType === 'LINK') {
        return !!this.resourceLink.trim();
      }
      return !!this.selectedFile;
    }
    
    // Title and content are sufficient without resource
    return true;
  }

  resetForm(): void {
    this.newTopic = {
      title: '',
      content: ''
    };
    this.rating = 0;
    this.hoveredRating = 0;
    this.selectedPhotos = [];
    this.photoPreviewUrls = [];
    this.mediaBase64Data = [];
    this.resourceType = '';
    this.resourceLink = '';
    this.selectedFile = null;
    this.filePreviewUrl = '';
    this.uploadingFile = false;
  }
  
  onPhotosSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      
      // Limit to 10 photos maximum
      if (this.selectedPhotos.length + files.length > 10) {
        Swal.fire({
          title: 'Limit reached',
          text: 'You can upload up to 10 photos maximum',
          icon: 'warning',
          confirmButtonColor: '#dc2626'
        });
        return;
      }
      
      // Check file sizes (max 2MB per file)
      const maxSize = 2 * 1024 * 1024; // 2MB
      const oversizedFiles = files.filter(f => f.size > maxSize);
      if (oversizedFiles.length > 0) {
        Swal.fire({
          title: 'File too large',
          text: 'Each file must be less than 2MB. Please use smaller images.',
          icon: 'warning',
          confirmButtonColor: '#dc2626'
        });
        return;
      }
      
      // Only accept images (no videos for now)
      const nonImages = files.filter(f => !f.type.startsWith('image/'));
      if (nonImages.length > 0) {
        Swal.fire({
          title: 'Invalid file type',
          text: 'Only images (JPG, PNG) are supported',
          icon: 'warning',
          confirmButtonColor: '#dc2626'
        });
        return;
      }
      
      this.selectedPhotos = [...this.selectedPhotos, ...files];
      
      // Generate preview URLs and base64 data
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const dataUrl = e.target.result;
          this.photoPreviewUrls.push(dataUrl);
          this.mediaBase64Data.push(dataUrl);
          this.cdr.markForCheck();
        };
        reader.readAsDataURL(file);
      });
    }
  }
  
  removePhoto(index: number): void {
    this.selectedPhotos.splice(index, 1);
    this.photoPreviewUrls.splice(index, 1);
    this.mediaBase64Data.splice(index, 1);
    this.cdr.markForCheck();
  }
  
  onResourceFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Check file size (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        Swal.fire({
          title: 'File too large',
          text: 'File must be less than 50MB',
          icon: 'warning',
          confirmButtonColor: '#dc2626'
        });
        return;
      }
      
      // Determine resource type
      if (file.type.startsWith('image/')) {
        this.resourceType = 'IMAGE';
      } else if (file.type === 'application/pdf') {
        this.resourceType = 'PDF';
      } else if (file.type.startsWith('video/')) {
        this.resourceType = 'VIDEO';
      } else {
        Swal.fire({
          title: 'Invalid file type',
          text: 'Only images, PDFs, and videos are supported',
          icon: 'warning',
          confirmButtonColor: '#dc2626'
        });
        return;
      }
      
      this.selectedFile = file;
      
      // Generate preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.filePreviewUrl = e.target.result;
          this.cdr.markForCheck();
        };
        reader.readAsDataURL(file);
      } else {
        this.filePreviewUrl = '';
      }
      
      this.cdr.markForCheck();
    }
  }
  
  removeResourceFile(): void {
    this.selectedFile = null;
    this.filePreviewUrl = '';
    this.resourceType = '';
    this.cdr.markForCheck();
  }
  
  setResourceType(type: string): void {
    this.resourceType = type;
    if (type !== 'LINK') {
      this.resourceLink = '';
    }
    if (type === 'LINK') {
      this.selectedFile = null;
      this.filePreviewUrl = '';
    }
    this.cdr.markForCheck();
  }
  
  getStarsFromTitle(title: string): number[] {
    const match = title.match(/(\d+)\s+Star/);
    if (match) {
      const rating = parseInt(match[1], 10);
      return Array(rating).fill(0).map((_, i) => i + 1);
    }
    return [];
  }
  
  parseEventHighlightMedia(content: string): Array<{type: string, data: string, name: string}> {
    if (!content.startsWith('[EVENT_HIGHLIGHT_MEDIA]')) {
      return [];
    }
    
    const mediaString = content.replace('[EVENT_HIGHLIGHT_MEDIA]', '');
    const mediaItems = mediaString.split('[MEDIA_SEPARATOR]');
    
    return mediaItems.map(item => {
      try {
        return JSON.parse(item);
      } catch {
        return null;
      }
    }).filter(item => item !== null);
  }
  
  getEventHighlightDescription(content: string): string {
    if (!content.includes('[DESCRIPTION]')) {
      return '';
    }
    const parts = content.split('[DESCRIPTION]');
    return parts[1] || '';
  }

  goToTopic(topicId: number): void {
    // Détecter si on est dans le dashboard, tutor-panel ou user-panel
    const currentUrl = this.router.url;
    if (currentUrl.includes('/dashboard/')) {
      this.router.navigate(['/dashboard/forum/topic', topicId]);
    } else if (currentUrl.includes('/tutor-panel/')) {
      this.router.navigate(['/tutor-panel/forum/topic', topicId]);
    } else {
      this.router.navigate(['/user-panel/forum/topic', topicId]);
    }
  }

  goBack(): void {
    // Détecter le contexte (dashboard, tutor-panel, ou user-panel)
    const currentUrl = this.router.url;
    if (currentUrl.includes('/dashboard/')) {
      this.router.navigate(['/dashboard/forum']);
    } else if (currentUrl.includes('/tutor-panel/')) {
      this.router.navigate(['/tutor-panel/forum']);
    } else {
      this.router.navigate(['/user-panel/forum']);
    }
  }

  getTimeAgo(date: string): string {
    const now = new Date();
    const created = new Date(date);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return created.toLocaleDateString('en-US');
  }

  trackByTopicId(index: number, topic: Topic): number {
    return topic.id;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadTopics();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadTopics();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  changeSortBy(sortBy: string): void {
    this.sortBy = sortBy;
    this.currentPage = 0; // Reset to first page
    this.loadTopics();
  }

  getEmptyStateTitle(): string {
    if (this.sortBy === 'trending') {
      return 'No trending topics';
    }
    if (this.sortBy === 'helpful') {
      return 'No helpful topics yet';
    }
    if (this.sortBy === 'views') {
      return 'No viewed topics yet';
    }
    if (this.isReviewCategory) {
      return 'No reviews yet';
    }
    if (this.isAnnouncementCategory) {
      return 'No announcements yet';
    }
    return 'No topics yet';
  }

  getEmptyStateMessage(): string {
    if (this.sortBy === 'trending') {
      return 'No topics are trending right now. Topics need to be created in the last 7 days with a score of 5 or more to appear here.';
    }
    if (this.sortBy === 'helpful') {
      return 'No topics have been rated as helpful yet. Be the first to create valuable content!';
    }
    if (this.sortBy === 'views') {
      return 'No topics have been viewed yet.';
    }
    if (this.isReviewCategory) {
      return 'Be the first to review an event!';
    }
    if (this.isAnnouncementCategory) {
      return 'No announcements have been posted yet.';
    }
    return 'Be the first to create a topic in this category!';
  }

  sanitizeHtml(html: string) {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
