import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ForumService, Category } from '../../../services/forum.service';
import { ForumModerationComponent } from '../forum-moderation/forum-moderation.component';
import Swal from 'sweetalert2';

interface TabType {
  id: 'categories' | 'moderation';
  label: string;
  icon: string;
}

interface NewCategoryForm {
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface NewSubCategoryForm {
  categoryId: number;
  name: string;
  description: string;
}

@Component({
  selector: 'app-forum-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ForumModerationComponent],
  templateUrl: './forum-management.component.html',
  styleUrl: './forum-management.component.scss'
})
export class ForumManagementComponent implements OnInit {
  activeTab: 'categories' | 'moderation' = 'categories';
  
  tabs: TabType[] = [
    { id: 'categories', label: 'Categories', icon: 'fa-folder-tree' },
    { id: 'moderation', label: 'Moderation', icon: 'fa-shield-halved' }
  ];

  // Categories
  categories: Category[] = [];
  filteredCategories: Category[] = [];
  loadingCategories = true;
  selectedCategoryFilter: string = 'all';

  // Preview subcategories (for new category modal)
  previewSubcategories: Array<{name: string, description: string}> = [];
  previewSubcategoryName: string = '';
  previewSubcategoryDescription: string = '';

  // Modals
  showNewCategoryModal = false;
  showNewSubCategoryModal = false;

  // Forms
  newCategory: NewCategoryForm = {
    name: '',
    description: '',
    icon: 'fa-folder',
    color: 'primary'
  };

  newSubCategory: NewSubCategoryForm = {
    categoryId: 0,
    name: '',
    description: ''
  };

  constructor(private forumService: ForumService) {}

  ngOnInit(): void {
    this.loadCategories();
  }



  // Categories Management
  loadCategories(): void {
    this.loadingCategories = true;
    this.forumService.getAllCategories().subscribe({
      next: (data) => {
        this.categories = data;
        this.applyFilter();
        this.loadingCategories = false;
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.loadingCategories = false;
        Swal.fire({
          title: 'Error',
          text: 'Failed to load categories',
          icon: 'error',
          confirmButtonColor: '#dc2626'
        });
      }
    });
  }

  getTotalSubcategories(): number {
    return this.categories.reduce((total, category) => {
      return total + (category.subCategories?.length || 0);
    }, 0);
  }

  applyFilter(): void {
    if (this.selectedCategoryFilter === 'all') {
      this.filteredCategories = this.categories;
    } else if (this.selectedCategoryFilter === 'locked') {
      this.filteredCategories = this.categories.filter(cat => cat.isLocked);
    } else if (this.selectedCategoryFilter === 'unlocked') {
      this.filteredCategories = this.categories.filter(cat => !cat.isLocked);
    } else {
      // Filter by specific category ID
      this.filteredCategories = this.categories.filter(cat => cat.id.toString() === this.selectedCategoryFilter);
    }
  }

  onFilterChange(): void {
    this.applyFilter();
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

  getTruncatedContent(content: string, maxLength: number = 100): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }

  openNewCategoryModal(): void {
    this.showNewCategoryModal = true;
    this.resetCategoryForm();
  }

  closeNewCategoryModal(): void {
    this.showNewCategoryModal = false;
    this.resetCategoryForm();
  }

  addEmojiToName(emoji: string): void {
    if (!this.newCategory.name.trim()) {
      this.newCategory.name = emoji + ' ';
    } else if (!this.newCategory.name.includes(emoji)) {
      this.newCategory.name = emoji + ' ' + this.newCategory.name.trim();
    }
  }

  addPreviewSubcategory(): void {
    if (this.previewSubcategoryName.trim() && this.previewSubcategoryDescription.trim()) {
      this.previewSubcategories.push({
        name: this.previewSubcategoryName.trim(),
        description: this.previewSubcategoryDescription.trim()
      });
      this.previewSubcategoryName = '';
      this.previewSubcategoryDescription = '';
    }
  }

  removePreviewSubcategory(index: number): void {
    this.previewSubcategories.splice(index, 1);
  }

  openNewSubCategoryModal(): void {
    this.showNewSubCategoryModal = true;
    this.resetSubCategoryForm();
  }

  closeNewSubCategoryModal(): void {
    this.showNewSubCategoryModal = false;
    this.resetSubCategoryForm();
  }

  openNewSubCategoryModalFromPreview(): void {
    if (!this.isCategoryFormValid()) {
      Swal.fire({
        title: 'Incomplete Form',
        text: 'Please fill in the category name and description first.',
        icon: 'warning',
        confirmButtonColor: '#2D5757'
      });
      return;
    }

    const request = {
      name: this.newCategory.name,
      description: this.newCategory.description,
      icon: this.newCategory.icon,
      color: this.newCategory.color
    };

    this.forumService.createCategory(request).subscribe({
      next: (category) => {
        Swal.fire({
          title: 'Success!',
          text: 'Category created successfully. Now add a subcategory.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        
        this.closeNewCategoryModal();
        this.loadCategories();
        
        setTimeout(() => {
          this.newSubCategory.categoryId = category.id;
          this.openNewSubCategoryModal();
        }, 500);
      },
      error: (err) => {
        console.error('Error creating category:', err);
        Swal.fire({
          title: 'Error',
          text: 'Failed to create category',
          icon: 'error',
          confirmButtonColor: '#dc2626'
        });
      }
    });
  }

  submitNewCategory(): void {
    if (this.isCategoryFormValid()) {
      const request = {
        name: this.newCategory.name,
        description: this.newCategory.description,
        icon: this.newCategory.icon,
        color: this.newCategory.color
      };

      this.forumService.createCategory(request).subscribe({
        next: (category) => {
          if (this.previewSubcategories.length > 0) {
            this.createPreviewSubcategories(category.id);
          } else {
            Swal.fire({
              title: 'Success!',
              text: 'Category created successfully.',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
            this.closeNewCategoryModal();
            this.loadCategories();
          }
        },
        error: (err) => {
          console.error('Error creating category:', err);
          Swal.fire({
            title: 'Error',
            text: 'Failed to create category',
            icon: 'error',
            confirmButtonColor: '#dc2626'
          });
        }
      });
    }
  }

  createPreviewSubcategories(categoryId: number): void {
    let createdCount = 0;
    const totalCount = this.previewSubcategories.length;

    this.previewSubcategories.forEach((sub) => {
      const subRequest = {
        categoryId: categoryId,
        name: sub.name,
        description: sub.description
      };

      this.forumService.createSubCategory(subRequest).subscribe({
        next: () => {
          createdCount++;
          if (createdCount === totalCount) {
            Swal.fire({
              title: 'Success!',
              text: `Category and ${totalCount} subcategories created successfully.`,
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
            this.closeNewCategoryModal();
            this.loadCategories();
          }
        },
        error: (err) => {
          console.error('Error creating subcategory:', err);
        }
      });
    });
  }

  isCategoryFormValid(): boolean {
    return !!(this.newCategory.name.trim() && this.newCategory.description.trim());
  }

  resetCategoryForm(): void {
    this.newCategory = {
      name: '',
      description: '',
      icon: 'fa-folder',
      color: 'primary'
    };
    this.previewSubcategories = [];
    this.previewSubcategoryName = '';
    this.previewSubcategoryDescription = '';
  }

  submitNewSubCategory(): void {
    if (this.isSubCategoryFormValid()) {
      const request = {
        categoryId: this.newSubCategory.categoryId,
        name: this.newSubCategory.name,
        description: this.newSubCategory.description
      };

      this.forumService.createSubCategory(request).subscribe({
        next: () => {
          Swal.fire({
            title: 'Success!',
            text: 'Subcategory created successfully.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
          this.closeNewSubCategoryModal();
          this.loadCategories();
        },
        error: (err) => {
          console.error('Error creating subcategory:', err);
          Swal.fire({
            title: 'Error',
            text: 'Failed to create subcategory',
            icon: 'error',
            confirmButtonColor: '#dc2626'
          });
        }
      });
    }
  }

  isSubCategoryFormValid(): boolean {
    return !!(
      this.newSubCategory.categoryId &&
      this.newSubCategory.name.trim() &&
      this.newSubCategory.description.trim()
    );
  }

  resetSubCategoryForm(): void {
    this.newSubCategory = {
      categoryId: 0,
      name: '',
      description: ''
    };
  }

  deleteSubCategory(subCategoryId: number, subCategoryName: string): void {
    Swal.fire({
      title: 'Delete Subcategory',
      text: `Are you sure you want to delete "${subCategoryName}"? All topics in this subcategory will also be deleted.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.forumService.deleteSubCategory(subCategoryId).subscribe({
          next: () => {
            Swal.fire({
              title: 'Deleted!',
              text: 'The subcategory has been successfully deleted.',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
            this.loadCategories();
          },
          error: (err) => {
            console.error('Error deleting subcategory:', err);
            Swal.fire({
              title: 'Error',
              text: 'Failed to delete subcategory',
              icon: 'error',
              confirmButtonColor: '#dc2626'
            });
          }
        });
      }
    });
  }

  deleteCategory(categoryId: number, categoryName: string): void {
    Swal.fire({
      title: 'Delete Category',
      text: `Are you sure you want to delete "${categoryName}"? All subcategories and topics will also be deleted.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.forumService.deleteCategory(categoryId).subscribe({
          next: () => {
            Swal.fire({
              title: 'Deleted!',
              text: 'The category has been successfully deleted.',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
            this.loadCategories();
          },
          error: (err) => {
            console.error('Error deleting category:', err);
            Swal.fire({
              title: 'Error',
              text: 'Failed to delete category',
              icon: 'error',
              confirmButtonColor: '#dc2626'
            });
          }
        });
      }
    });
  }

  lockCategory(categoryId: number, categoryName: string): void {
    Swal.fire({
      title: 'Lock Category',
      text: `Lock "${categoryName}"? Only Academic Office Affairs will be able to post in all subcategories.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#F59E0B',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Lock',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        const userId = 1;
        this.forumService.lockCategory(categoryId, userId).subscribe({
          next: () => {
            Swal.fire({
              title: 'Locked!',
              text: 'The category has been locked.',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
            this.loadCategories();
          },
          error: (err) => {
            console.error('Error locking category:', err);
            Swal.fire({
              title: 'Error',
              text: 'Failed to lock category',
              icon: 'error',
              confirmButtonColor: '#dc2626'
            });
          }
        });
      }
    });
  }

  unlockCategory(categoryId: number, categoryName: string): void {
    Swal.fire({
      title: 'Unlock Category',
      text: `Unlock "${categoryName}"? All users will be able to post again.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Unlock',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        const userId = 1;
        this.forumService.unlockCategory(categoryId, userId).subscribe({
          next: () => {
            Swal.fire({
              title: 'Unlocked!',
              text: 'The category has been unlocked.',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
            this.loadCategories();
          },
          error: (err) => {
            console.error('Error unlocking category:', err);
            Swal.fire({
              title: 'Error',
              text: 'Failed to unlock category',
              icon: 'error',
              confirmButtonColor: '#dc2626'
            });
          }
        });
      }
    });
  }

  lockSubCategory(subCategoryId: number, subCategoryName: string): void {
    Swal.fire({
      title: 'Lock Subcategory',
      text: `Lock "${subCategoryName}"? Only Academic Office Affairs will be able to post here.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#F59E0B',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Lock',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        const userId = 1;
        this.forumService.lockSubCategory(subCategoryId, userId).subscribe({
          next: () => {
            Swal.fire({
              title: 'Locked!',
              text: 'The subcategory has been locked.',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
            this.loadCategories();
          },
          error: (err) => {
            console.error('Error locking subcategory:', err);
            Swal.fire({
              title: 'Error',
              text: 'Failed to lock subcategory',
              icon: 'error',
              confirmButtonColor: '#dc2626'
            });
          }
        });
      }
    });
  }

  unlockSubCategory(subCategoryId: number, subCategoryName: string): void {
    Swal.fire({
      title: 'Unlock Subcategory',
      text: `Unlock "${subCategoryName}"? All users will be able to post again.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Unlock',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        const userId = 1;
        this.forumService.unlockSubCategory(subCategoryId, userId).subscribe({
          next: () => {
            Swal.fire({
              title: 'Unlocked!',
              text: 'The subcategory has been unlocked.',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
            this.loadCategories();
          },
          error: (err) => {
            console.error('Error unlocking subcategory:', err);
            Swal.fire({
              title: 'Error',
              text: 'Failed to unlock subcategory',
              icon: 'error',
              confirmButtonColor: '#dc2626'
            });
          }
        });
      }
    });
  }
}
