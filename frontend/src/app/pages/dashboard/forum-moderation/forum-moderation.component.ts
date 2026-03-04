import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ModerationService, ModerationStats } from '../../../services/moderation.service';
import { ForumService, Topic, Category, Post } from '../../../services/forum.service';
import { AuthService } from '../../../core/services/auth.service';
import Swal from 'sweetalert2';

interface SubCategory {
  id: number;
  name: string;
  description: string;
  categoryId: number;
  categoryName?: string;
  topicsCount?: number;
}

interface TopicParticipant {
  userId: number;
  userName: string;
  postsCount: number;
  isAuthor: boolean;
}

@Component({
  selector: 'app-forum-moderation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forum-moderation.component.html',
  styleUrl: './forum-moderation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForumModerationComponent implements OnInit {
  @Input() hideHeader: boolean = false;
  
  // Active Tab
  activeTab: 'categories' | 'subcategories' | 'topics' = 'topics';
  
  // Categories
  categories: Category[] = [];
  loadingCategories = false;
  
  // Subcategories
  allSubCategories: SubCategory[] = [];
  filteredSubCategories: SubCategory[] = [];
  loadingSubCategories = false;
  selectedCategoryForSubCat: number | null = null;
  
  // Topics
  topics: Topic[] = [];
  stats: ModerationStats | null = null;
  loading = true;
  error: string | null = null;
  
  // Filters for Topics
  selectedCategoryId: number | null = null;
  selectedSubCategoryId: number | null = null;
  selectedStatus: string = 'all';
  searchQuery: string = '';
  private searchTimeout: any = null;
  
  // Image carousel for Event Highlights
  currentImageIndex: number = 0;
  
  // Pagination
  currentPage = 0;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;
  
  // Selection
  selectedTopicIds: Set<number> = new Set();
  selectAll = false;
  
  // Topic Details Panel
  selectedTopic: Topic | null = null;
  topicParticipants: TopicParticipant[] = [];
  topicPosts: Post[] = [];
  loadingTopicDetails = false;
  showTopicDetailsPanel = false;
  
  // Modals
  showNewCategoryModal = false;
  showNewSubCategoryModal = false;
  showEditCategoryModal = false;
  showEditSubCategoryModal = false;
  
  // Forms
  newCategory = { name: '', description: '', icon: 'fa-folder', color: 'primary' };
  newSubCategory = { categoryId: 0, name: '', description: '' };
  editingCategory: Category | null = null;
  editingSubCategory: SubCategory | null = null;
  
  private moderationService = inject(ModerationService);
  private forumService = inject(ForumService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    // Always load categories for the filter dropdown
    this.loadCategories();
    
    // When hideHeader is true, set activeTab to 'topics' by default
    if (this.hideHeader) {
      this.activeTab = 'topics';
    }
    
    this.loadStats();
    this.loadTopics();
  }

  // Tab Management
  switchTab(tab: 'categories' | 'subcategories' | 'topics'): void {
    this.activeTab = tab;
    this.showTopicDetailsPanel = false;
    this.selectedTopic = null;
    
    if (tab === 'categories') {
      this.loadCategories();
    } else if (tab === 'subcategories') {
      this.loadSubCategories();
    } else if (tab === 'topics') {
      this.loadTopics();
    }
  }

  // Categories Management
  loadCategories(): void {
    this.loadingCategories = true;
    this.forumService.getAllCategories().subscribe({
      next: (data) => {
        this.categories = data;
        this.loadingCategories = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.loadingCategories = false;
        this.cdr.markForCheck();
      }
    });
  }

  openNewCategoryModal(): void {
    this.showNewCategoryModal = true;
    this.newCategory = { name: '', description: '', icon: 'fa-folder', color: 'primary' };
  }

  closeNewCategoryModal(): void {
    this.showNewCategoryModal = false;
  }

  submitNewCategory(): void {
    if (this.newCategory.name.trim() && this.newCategory.description.trim()) {
      this.forumService.createCategory(this.newCategory).subscribe({
        next: () => {
          Swal.fire('Success!', 'Category created successfully', 'success');
          this.closeNewCategoryModal();
          this.loadCategories();
        },
        error: (err) => {
          console.error('Error creating category:', err);
          Swal.fire('Error', 'Failed to create category', 'error');
        }
      });
    }
  }

  lockCategory(category: Category): void {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return;

    Swal.fire({
      title: 'Lock Category',
      text: `Lock "${category.name}"? Users won't be able to create new topics.`,
      input: 'text',
      inputPlaceholder: 'Reason for locking (optional)',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Lock'
    }).then((result) => {
      if (result.isConfirmed) {
        this.moderationService.lockCategory(category.id, currentUser.id, result.value).subscribe({
          next: () => {
            Swal.fire('Locked!', 'Category has been locked', 'success');
            this.loadCategories();
          },
          error: (err) => {
            console.error('Error locking category:', err);
            Swal.fire('Error', 'Failed to lock category', 'error');
          }
        });
      }
    });
  }

  unlockCategory(category: Category): void {
    this.moderationService.unlockCategory(category.id).subscribe({
      next: () => {
        Swal.fire('Unlocked!', 'Category has been unlocked', 'success');
        this.loadCategories();
      },
      error: (err) => {
        console.error('Error unlocking category:', err);
        Swal.fire('Error', 'Failed to unlock category', 'error');
      }
    });
  }

  deleteCategory(category: Category): void {
    Swal.fire({
      title: 'Delete Category',
      text: `Delete "${category.name}"? All subcategories and topics will be deleted!`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Delete'
    }).then((result) => {
      if (result.isConfirmed) {
        this.forumService.deleteCategory(category.id).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'Category has been deleted', 'success');
            this.loadCategories();
          },
          error: (err) => {
            console.error('Error deleting category:', err);
            Swal.fire('Error', 'Failed to delete category', 'error');
          }
        });
      }
    });
  }

  // SubCategories Management
  loadSubCategories(): void {
    this.loadingSubCategories = true;
    this.forumService.getAllCategories().subscribe({
      next: (categories) => {
        this.allSubCategories = [];
        categories.forEach(cat => {
          cat.subCategories.forEach(sub => {
            this.allSubCategories.push({
              ...sub,
              categoryId: cat.id,
              categoryName: cat.name,
              topicsCount: 0 // TODO: Get from API
            });
          });
        });
        this.filterSubCategories();
        this.loadingSubCategories = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading subcategories:', err);
        this.loadingSubCategories = false;
        this.cdr.markForCheck();
      }
    });
  }

  filterSubCategories(): void {
    if (this.selectedCategoryForSubCat) {
      this.filteredSubCategories = this.allSubCategories.filter(
        sub => sub.categoryId === this.selectedCategoryForSubCat
      );
    } else {
      this.filteredSubCategories = this.allSubCategories;
    }
    this.cdr.markForCheck();
  }

  openNewSubCategoryModal(): void {
    this.showNewSubCategoryModal = true;
    this.newSubCategory = { categoryId: 0, name: '', description: '' };
  }

  closeNewSubCategoryModal(): void {
    this.showNewSubCategoryModal = false;
  }

  submitNewSubCategory(): void {
    if (this.newSubCategory.categoryId && this.newSubCategory.name.trim()) {
      this.forumService.createSubCategory(this.newSubCategory).subscribe({
        next: () => {
          Swal.fire('Success!', 'Subcategory created successfully', 'success');
          this.closeNewSubCategoryModal();
          this.loadSubCategories();
        },
        error: (err) => {
          console.error('Error creating subcategory:', err);
          Swal.fire('Error', 'Failed to create subcategory', 'error');
        }
      });
    }
  }

  deleteSubCategory(subCat: SubCategory): void {
    Swal.fire({
      title: 'Delete Subcategory',
      text: `Delete "${subCat.name}"? All topics will be deleted!`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Delete'
    }).then((result) => {
      if (result.isConfirmed) {
        this.forumService.deleteSubCategory(subCat.id).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'Subcategory has been deleted', 'success');
            this.loadSubCategories();
          },
          error: (err) => {
            console.error('Error deleting subcategory:', err);
            Swal.fire('Error', 'Failed to delete subcategory', 'error');
          }
        });
      }
    });
  }

  loadStats(): void {
    this.moderationService.getStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading stats:', err);
      }
    });
  }

  loadTopics(): void {
    this.loading = true;
    this.error = null;
    
    const categoryId = this.selectedCategoryId || undefined;
    const subCategoryId = this.selectedSubCategoryId || undefined;
    const status = this.selectedStatus === 'all' ? undefined : this.selectedStatus;
    const search = this.searchQuery.trim() || undefined;
    
    this.moderationService.getAllTopics(
      categoryId,
      subCategoryId,
      status,
      search,
      this.currentPage,
      this.pageSize
    ).subscribe({
      next: (response) => {
        this.topics = response.content;
        this.totalPages = response.totalPages;
        this.totalElements = response.totalElements;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading topics:', err);
        this.error = 'Error loading topics';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.loadTopics();
  }

  clearFilters(): void {
    this.selectedCategoryId = null;
    this.selectedSubCategoryId = null;
    this.selectedStatus = 'all';
    this.searchQuery = '';
    this.currentPage = 0;
    this.loadTopics();
  }

  onSearchChange(searchValue: string): void {
    // Clear previous timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    // Set new timeout for debounce (wait 500ms after user stops typing)
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 0;
      this.loadTopics();
    }, 500);
  }

  onCategoryFilterChange(): void {
    this.selectedSubCategoryId = null;
    this.applyFilters();
  }

  getSubCategoriesForSelectedCategory(): any[] {
    if (!this.selectedCategoryId) return [];
    const category = this.categories.find(c => c.id === this.selectedCategoryId);
    return category ? category.subCategories : [];
  }

  // Topic Details Panel
  viewTopicDetails(topic: Topic): void {
    this.selectedTopic = topic;
    this.showTopicDetailsPanel = true;
    this.currentImageIndex = 0; // Reset image index
    this.loadTopicParticipants(topic.id);
    this.cdr.markForCheck();
  }

  closeTopicDetailsPanel(): void {
    this.showTopicDetailsPanel = false;
    this.selectedTopic = null;
    this.topicParticipants = [];
    this.topicPosts = [];
    this.currentImageIndex = 0;
  }

  // Event Highlights image carousel methods
  isEventHighlight(topic: Topic): boolean {
    try {
      if (!topic.content) return false;
      
      // Check if content starts with [EVENT_HIGHLIGHT_MEDIA]
      return topic.content.trim().startsWith('[EVENT_HIGHLIGHT_MEDIA]');
    } catch (e) {
      console.error('Error checking if event highlight:', e);
      return false;
    }
  }

  getResourceUrl(resourceLink: string): string {
    if (!resourceLink) return '';
    
    // If it's already a full URL, return as is
    if (resourceLink.startsWith('http')) {
      return resourceLink;
    }
    
    // Otherwise, prepend the backend URL
    return `http://localhost:8082${resourceLink}`;
  }

  getEventImages(topic: Topic): string[] {
    try {
      if (!topic.content) return [];
      
      const images: string[] = [];
      
      // Split by [MEDIA_SEPARATOR] to get individual media items
      const segments = topic.content.split('[MEDIA_SEPARATOR]');
      
      for (let segment of segments) {
        // Remove [EVENT_HIGHLIGHT_MEDIA] prefix if present
        segment = segment.replace('[EVENT_HIGHLIGHT_MEDIA]', '').trim();
        
        if (!segment) continue;
        
        try {
          const parsed = JSON.parse(segment);
          if (parsed.type === 'image' && parsed.data) {
            // data is a string (single image URL), not an array
            const url = parsed.data;
            if (url.startsWith('http')) {
              images.push(url);
            } else {
              // Prepend base URL for relative paths
              images.push(`http://localhost:8082${url}`);
            }
          }
        } catch (e) {
          console.error('Error parsing segment:', segment, e);
        }
      }
      
      return images;
    } catch (e) {
      console.error('Error parsing event images:', e);
      return [];
    }
  }

  nextImage(): void {
    if (this.selectedTopic) {
      const images = this.getEventImages(this.selectedTopic);
      if (images.length > 0) {
        this.currentImageIndex = (this.currentImageIndex + 1) % images.length;
        this.cdr.markForCheck();
      }
    }
  }

  previousImage(): void {
    if (this.selectedTopic) {
      const images = this.getEventImages(this.selectedTopic);
      if (images.length > 0) {
        this.currentImageIndex = (this.currentImageIndex - 1 + images.length) % images.length;
        this.cdr.markForCheck();
      }
    }
  }

  loadTopicParticipants(topicId: number): void {
    this.loadingTopicDetails = true;
    
    // Load all posts for this topic
    this.forumService.getPostsByTopic(topicId, 0, 1000).subscribe({
      next: (response) => {
        this.topicPosts = response.content;
        
        // Extract unique participants
        const participantsMap = new Map<number, TopicParticipant>();
        
        // Add topic author
        if (this.selectedTopic) {
          participantsMap.set(this.selectedTopic.userId, {
            userId: this.selectedTopic.userId,
            userName: this.selectedTopic.userName,
            postsCount: 0,
            isAuthor: true
          });
        }
        
        // Add all post authors
        response.content.forEach(post => {
          if (participantsMap.has(post.userId)) {
            participantsMap.get(post.userId)!.postsCount++;
          } else {
            participantsMap.set(post.userId, {
              userId: post.userId,
              userName: post.userName,
              postsCount: 1,
              isAuthor: false
            });
          }
        });
        
        this.topicParticipants = Array.from(participantsMap.values())
          .sort((a, b) => {
            if (a.isAuthor) return -1;
            if (b.isAuthor) return 1;
            return b.postsCount - a.postsCount;
          });
        
        this.loadingTopicDetails = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading topic participants:', err);
        this.loadingTopicDetails = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Selection management
  toggleSelectAll(): void {
    this.selectAll = !this.selectAll;
    if (this.selectAll) {
      this.topics.forEach(topic => this.selectedTopicIds.add(topic.id));
    } else {
      this.selectedTopicIds.clear();
    }
    this.cdr.markForCheck();
  }

  toggleTopicSelection(topicId: number): void {
    if (this.selectedTopicIds.has(topicId)) {
      this.selectedTopicIds.delete(topicId);
    } else {
      this.selectedTopicIds.add(topicId);
    }
    this.selectAll = this.selectedTopicIds.size === this.topics.length;
    this.cdr.markForCheck();
  }

  isTopicSelected(topicId: number): boolean {
    return this.selectedTopicIds.has(topicId);
  }

  getSelectedCount(): number {
    return this.selectedTopicIds.size;
  }

  // Bulk actions
  bulkPin(): void {
    if (this.selectedTopicIds.size === 0) {
      Swal.fire('No Selection', 'Please select topics to pin', 'warning');
      return;
    }

    Swal.fire({
      title: 'Pin Topics',
      text: `Pin ${this.selectedTopicIds.size} selected topic(s)?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      confirmButtonText: 'Pin',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.moderationService.bulkPinTopics(Array.from(this.selectedTopicIds)).subscribe({
          next: (response) => {
            Swal.fire('Success!', `${response.count} topic(s) pinned`, 'success');
            this.selectedTopicIds.clear();
            this.selectAll = false;
            this.loadTopics();
            this.loadStats();
          },
          error: (err) => {
            console.error('Error pinning topics:', err);
            Swal.fire('Error', 'Failed to pin topics', 'error');
          }
        });
      }
    });
  }

  bulkUnpin(): void {
    if (this.selectedTopicIds.size === 0) {
      Swal.fire('No Selection', 'Please select topics to unpin', 'warning');
      return;
    }

    this.moderationService.bulkUnpinTopics(Array.from(this.selectedTopicIds)).subscribe({
      next: (response) => {
        Swal.fire('Success!', `${response.count} topic(s) unpinned`, 'success');
        this.selectedTopicIds.clear();
        this.selectAll = false;
        this.loadTopics();
        this.loadStats();
      },
      error: (err) => {
        console.error('Error unpinning topics:', err);
        Swal.fire('Error', 'Failed to unpin topics', 'error');
      }
    });
  }

  bulkLock(): void {
    if (this.selectedTopicIds.size === 0) {
      Swal.fire('No Selection', 'Please select topics to lock', 'warning');
      return;
    }

    Swal.fire({
      title: 'Lock Topics',
      text: `Lock ${this.selectedTopicIds.size} selected topic(s)? This will prevent new replies.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Lock',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.moderationService.bulkLockTopics(Array.from(this.selectedTopicIds)).subscribe({
          next: (response) => {
            Swal.fire('Success!', `${response.count} topic(s) locked`, 'success');
            this.selectedTopicIds.clear();
            this.selectAll = false;
            this.loadTopics();
            this.loadStats();
          },
          error: (err) => {
            console.error('Error locking topics:', err);
            Swal.fire('Error', 'Failed to lock topics', 'error');
          }
        });
      }
    });
  }

  bulkUnlock(): void {
    if (this.selectedTopicIds.size === 0) {
      Swal.fire('No Selection', 'Please select topics to unlock', 'warning');
      return;
    }

    this.moderationService.bulkUnlockTopics(Array.from(this.selectedTopicIds)).subscribe({
      next: (response) => {
        Swal.fire('Success!', `${response.count} topic(s) unlocked`, 'success');
        this.selectedTopicIds.clear();
        this.selectAll = false;
        this.loadTopics();
        this.loadStats();
      },
      error: (err) => {
        console.error('Error unlocking topics:', err);
        Swal.fire('Error', 'Failed to unlock topics', 'error');
      }
    });
  }

  bulkDelete(): void {
    if (this.selectedTopicIds.size === 0) {
      Swal.fire('No Selection', 'Please select topics to delete', 'warning');
      return;
    }

    Swal.fire({
      title: 'Delete Topics',
      text: `Delete ${this.selectedTopicIds.size} selected topic(s)? This action cannot be undone!`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        const currentUser = this.authService.currentUserValue;
        if (!currentUser) return;

        this.moderationService.bulkDeleteTopics(Array.from(this.selectedTopicIds), currentUser.id).subscribe({
          next: (response) => {
            Swal.fire('Deleted!', `${response.count} topic(s) deleted`, 'success');
            this.selectedTopicIds.clear();
            this.selectAll = false;
            this.loadTopics();
            this.loadStats();
          },
          error: (err) => {
            console.error('Error deleting topics:', err);
            Swal.fire('Error', 'Failed to delete topics', 'error');
          }
        });
      }
    });
  }

  // Pagination
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

  // Utility
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

  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  }

  getSubCategoryCount(categoryId: number): number {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.subCategories.length : 0;
  }

  // Expose Math to template
  Math = Math;
}
