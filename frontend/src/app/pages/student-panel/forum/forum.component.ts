import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ForumService, Category } from '../../../services/forum.service';

@Component({
  selector: 'app-forum',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './forum.component.html',
  styleUrl: './forum.component.scss'
})
export class ForumComponent implements OnInit {
  categories: Category[] = [];
  loading = true;
  error: string | null = null;
  routePrefix: string = '/user-panel';

  constructor(
    private forumService: ForumService,
    private router: Router
  ) {
    // Detect if we're in tutor-panel or user-panel
    const currentUrl = this.router.url;
    if (currentUrl.includes('/tutor-panel')) {
      this.routePrefix = '/tutor-panel';
    } else if (currentUrl.includes('/user-panel')) {
      this.routePrefix = '/user-panel';
    } else if (currentUrl.includes('/dashboard')) {
      this.routePrefix = '/dashboard';
    }
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  createSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  getRoutePrefix(subCategoryName: string): string {
    // Use 'reviews' for Event Feedback & Reviews, 'topics' for others
    return subCategoryName === 'Event Feedback & Reviews' ? 'reviews' : 'topics';
  }

  loadCategories(): void {
    this.loading = true;
    this.error = null;
    this.forumService.getAllCategories().subscribe({
      next: (data) => {
        this.categories = data;
        this.loading = false;
        
        // Si aucune catégorie, initialiser
        if (!data || data.length === 0) {
          this.initializeCategories();
        }
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.error = 'Erreur lors du chargement des catégories';
        this.loading = false;
      }
    });
  }

  initializeCategories(): void {
    this.forumService.initializeCategories().subscribe({
      next: () => {
        console.log('Categories initialized');
        this.loadCategories();
      },
      error: (err) => {
        console.error('Error initializing categories:', err);
      }
    });
  }
}
