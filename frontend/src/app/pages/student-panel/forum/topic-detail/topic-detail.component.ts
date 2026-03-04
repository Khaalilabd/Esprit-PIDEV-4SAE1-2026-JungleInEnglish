import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { QuillEditorComponent } from 'ngx-quill';
import { ForumService, Topic, Post, CreatePostRequest } from '../../../../services/forum.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ReactionBarComponent } from '../../../../components/reaction-bar/reaction-bar.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-topic-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactionBarComponent, QuillEditorComponent],
  templateUrl: './topic-detail.component.html',
  styleUrl: './topic-detail.component.scss'
})
export class TopicDetailComponent implements OnInit, OnDestroy {
  topic: Topic | null = null;
  posts: Post[] = [];
  topicId!: number;
  loading = true;
  loadingPosts = true;
  error: string | null = null;
  canReply = false;
  
  // Event Highlights
  isEventHighlight = false;
  eventMedia: Array<{type: string, data: string, name: string}> = [];
  eventDescription: string = '';
  currentMediaIndex = 0;
  
  // Recruitment
  isRecruitmentTopic = false;
  
  currentPage = 0;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;
  sortBy = 'helpful'; // Default sort: most helpful

  // Modal state
  showReplyModal = false;
  showEditPostModal = false;
  
  // Form data
  newPost = {
    content: ''
  };

  editingPost: Post | null = null;

  // Quill configuration
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

  private authService = inject(AuthService);
  private sanitizer = inject(DomSanitizer);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private forumService: ForumService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.topicId = +params['topicId'];
      this.loadTopic();
      this.loadPosts();
    });
    
    // Add keyboard navigation for carousel
    document.addEventListener('keydown', this.handleKeyboardNavigation.bind(this));
  }
  
  ngOnDestroy(): void {
    // Clean up keyboard event listener
    document.removeEventListener('keydown', this.handleKeyboardNavigation.bind(this));
  }
  
  handleKeyboardNavigation(event: KeyboardEvent): void {
    if (!this.isEventHighlight || this.eventMedia.length <= 1) return;
    
    if (event.key === 'ArrowLeft') {
      this.previousMedia();
    } else if (event.key === 'ArrowRight') {
      this.nextMedia();
    }
  }

  loadTopic(): void {
    this.loading = true;
    this.error = null;
    
    console.log('=== LOADING TOPIC ===');
    console.log('Topic ID:', this.topicId);
    
    this.forumService.getTopicById(this.topicId).subscribe({
      next: (data) => {
        console.log('=== TOPIC LOADED ===');
        console.log('Topic data:', data);
        
        this.topic = data;
        
        // Check permissions
        this.checkReplyPermission(data.subCategoryId);
        
        // Check if this is a Recruitment topic
        this.forumService.getSubCategoryById(data.subCategoryId).subscribe({
          next: (subCategory) => {
            this.isRecruitmentTopic = subCategory.name === 'Recruitment & Applications';
          }
        });
        
        // Check if this is an Event Highlight and parse media
        if (data.content && data.content.startsWith('[EVENT_HIGHLIGHT_MEDIA]')) {
          this.isEventHighlight = true;
          const result = this.parseEventHighlightMedia(data.content);
          this.eventMedia = result.media;
          this.eventDescription = result.description;
        }
        
        this.loading = false;
        console.log('Topic loaded successfully');
      },
      error: (err) => {
        console.error('Error loading topic:', err);
        this.error = 'Error loading topic';
        this.loading = false;
      }
    });
  }
  
  checkReplyPermission(subCategoryId: number): void {
    const currentUser = this.authService.currentUserValue;
    
    if (!currentUser) {
      this.canReply = false;
      return;
    }
    
    this.forumService.getPermissions(subCategoryId, currentUser.role).subscribe({
      next: (permissions) => {
        // If topic itself is locked, nobody can reply (override permission check)
        if (this.topic?.isLocked) {
          this.canReply = false;
        } else {
          this.canReply = permissions.canReply;
        }
      },
      error: (err) => {
        console.error('Error checking reply permissions:', err);
        this.canReply = false;
      }
    });
  }
  
  parseEventHighlightMedia(content: string): {media: Array<{type: string, data: string, name: string}>, description: string} {
    if (!content.startsWith('[EVENT_HIGHLIGHT_MEDIA]')) {
      return {media: [], description: ''};
    }
    
    // Extract description if present
    let description = '';
    let mediaContent = content;
    
    if (content.includes('[DESCRIPTION]')) {
      const parts = content.split('[DESCRIPTION]');
      mediaContent = parts[0];
      description = parts[1] || '';
    }
    
    const mediaString = mediaContent.replace('[EVENT_HIGHLIGHT_MEDIA]', '');
    const mediaItems = mediaString.split('[MEDIA_SEPARATOR]');
    
    const media = mediaItems.map(item => {
      try {
        const parsed = JSON.parse(item);
        // Convert file path to full URL if it's a relative path
        if (parsed.data && !parsed.data.startsWith('http') && !parsed.data.startsWith('data:')) {
          // Remove leading slash if present
          const cleanPath = parsed.data.startsWith('/') ? parsed.data.substring(1) : parsed.data;
          parsed.data = `http://localhost:8080/${cleanPath}`;
        }
        return parsed;
      } catch {
        return null;
      }
    }).filter(item => item !== null);
    
    return {media, description};
  }
  
  nextMedia(): void {
    if (this.currentMediaIndex < this.eventMedia.length - 1) {
      this.currentMediaIndex++;

    }
  }
  
  previousMedia(): void {
    if (this.currentMediaIndex > 0) {
      this.currentMediaIndex--;

    }
  }
  
  goToMedia(index: number): void {
    this.currentMediaIndex = index;

  }
  
  getYouTubeEmbedUrl(url: string): SafeResourceUrl {
    // Extract video ID from YouTube URL
    let videoId = '';
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1].split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    }
    
    if (videoId) {
      const embedUrl = `https://www.youtube.com/embed/${videoId}`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
  
  getSafeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  loadPosts(): void {
    this.loadingPosts = true;
    
    this.forumService.getPostsByTopic(this.topicId, this.currentPage, this.pageSize, this.sortBy).subscribe({
      next: (response) => {
        this.posts = response.content;
        this.totalPages = response.totalPages;
        this.totalElements = response.totalElements;
        this.loadingPosts = false;

      },
      error: (err) => {
        console.error('Error loading posts:', err);
        this.loadingPosts = false;

      }
    });
  }

  openReplyModal(): void {
    if (this.topic?.isLocked) {
      Swal.fire({
        title: 'Topic Locked',
        text: 'This topic is locked and no longer accepts new replies.',
        icon: 'warning',
        confirmButtonColor: '#dc2626'
      });
      return;
    }
    this.showReplyModal = true;
    this.resetForm();
  }

  closeReplyModal(): void {
    this.showReplyModal = false;
    this.resetForm();
  }

  openEditPostModal(event: Event, post: Post): void {
    event.stopPropagation();
    this.editingPost = post;
    this.newPost = {
      content: post.content
    };
    this.showEditPostModal = true;
  }

  closeEditPostModal(): void {
    this.showEditPostModal = false;
    this.editingPost = null;
    this.resetForm();
  }

  submitReply(): void {
    if (this.isFormValid()) {
      const currentUser = this.authService.currentUserValue;
      
      if (!currentUser) {
        Swal.fire({
          title: 'Authentication Required',
          text: 'You must be logged in to post a reply',
          icon: 'warning',
          confirmButtonColor: '#dc2626'
        });
        return;
      }

      const request: CreatePostRequest = {
        topicId: this.topicId,
        content: this.newPost.content,
        userId: currentUser.id,
        userName: currentUser.firstName + ' ' + currentUser.lastName
      };

      this.forumService.createPost(request).subscribe({
        next: (post) => {
          console.log('Post created:', post);
          Swal.fire({
            title: 'Success!',
            text: 'Your reply has been posted successfully.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
          this.closeReplyModal();
          this.loadPosts();
          this.loadTopic();

        },
        error: (err) => {
          console.error('Error creating post:', err);
          Swal.fire({
            title: 'Error',
            text: 'Error posting your reply. Please try again.',
            icon: 'error',
            confirmButtonColor: '#dc2626'
          });
        }
      });
    }
  }

  submitEditPost(): void {
    if (this.isFormValid() && this.editingPost) {
      const request: CreatePostRequest = {
        topicId: this.topicId,
        content: this.newPost.content,
        userId: this.editingPost.userId,
        userName: this.editingPost.userName
      };

      this.forumService.updatePost(this.editingPost.id, request).subscribe({
        next: (post) => {
          console.log('Post updated:', post);
          Swal.fire({
            title: 'Updated!',
            text: 'Your reply has been updated successfully.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
          this.closeEditPostModal();
          this.loadPosts();
        },
        error: (err) => {
          console.error('Error updating post:', err);
          Swal.fire({
            title: 'Error',
            text: 'Error updating your reply',
            icon: 'error',
            confirmButtonColor: '#dc2626'
          });
        }
      });
    }
  }

  deletePost(event: Event, postId: number): void {
    event.stopPropagation();
    
    Swal.fire({
      title: 'Delete Reply',
      text: 'Are you sure you want to delete this reply?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.forumService.deletePost(postId).subscribe({
          next: () => {
            Swal.fire({
              title: 'Deleted!',
              text: 'The reply has been successfully deleted.',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
            this.loadPosts();
            this.loadTopic();
          },
          error: (err) => {
            console.error('Error deleting post:', err);
            Swal.fire({
              title: 'Error',
              text: 'Error deleting reply',
              icon: 'error',
              confirmButtonColor: '#dc2626'
            });
          }
        });
      }
    });
  }

  canEditOrDelete(post: Post): boolean {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return false;
    
    return post.userId === currentUser.id || 
           currentUser.role === 'ADMIN' || 
           currentUser.role === 'MODERATOR';
  }
  
  isPostEdited(post: Post): boolean {
    if (!post.updatedAt || !post.createdAt) return false;
    
    // Convert to timestamps and check if difference is more than 1 second
    const createdTime = new Date(post.createdAt).getTime();
    const updatedTime = new Date(post.updatedAt).getTime();
    
    return Math.abs(updatedTime - createdTime) > 1000; // More than 1 second difference
  }

  isFormValid(): boolean {
    return !!(this.newPost.content.trim());
  }

  resetForm(): void {
    this.newPost = {
      content: ''
    };
  }

  goBack(): void {
    const currentUrl = this.router.url;
    
    // Get subcategory name from topic if available
    let subCategoryName = 'Topics';
    if (this.topic) {
      // Fetch subcategory to get its name
      this.forumService.getSubCategoryById(this.topic.subCategoryId).subscribe({
        next: (subCategory) => {
          subCategoryName = subCategory.name;
          this.navigateToTopicList(currentUrl, subCategoryName);
        },
        error: () => {
          // Fallback to default name if fetch fails
          this.navigateToTopicList(currentUrl, subCategoryName);
        }
      });
    } else {
      this.navigateToTopicList(currentUrl, subCategoryName);
    }
  }
  
  private navigateToTopicList(currentUrl: string, subCategoryName: string): void {
    if (currentUrl.includes('/dashboard/')) {
      if (this.topic) {
        this.router.navigate(['/dashboard/forum/topics', this.topic.subCategoryId, subCategoryName]);
      } else {
        this.router.navigate(['/dashboard/forum']);
      }
    } else if (currentUrl.includes('/tutor-panel/')) {
      if (this.topic) {
        this.router.navigate(['/tutor-panel/forum/topics', this.topic.subCategoryId, subCategoryName]);
      } else {
        this.router.navigate(['/tutor-panel/forum']);
      }
    } else {
      if (this.topic) {
        this.router.navigate(['/user-panel/forum/topics', this.topic.subCategoryId, subCategoryName]);
      } else {
        this.router.navigate(['/user-panel/forum']);
      }
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

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadPosts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadPosts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  changeSortBy(sortBy: string): void {
    this.sortBy = sortBy;
    this.currentPage = 0; // Reset to first page
    this.loadPosts();
  }

  sanitizeHtml(html: string) {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

}
