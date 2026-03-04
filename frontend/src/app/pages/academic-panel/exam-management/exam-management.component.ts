import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ExamService } from '../../../core/services/exam.service';
import { ExamSummary, ExamLevel } from '../../../core/models/exam.model';

interface CreateExamRequest {
  title: string;
  level: ExamLevel;
  description: string;
  totalDuration: number;
  passingScore: number;
}

@Component({
  selector: 'app-exam-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exam-management.component.html',
  styleUrls: ['./exam-management.component.scss']
})
export class ExamManagementComponent implements OnInit {
  exams: ExamSummary[] = [];
  loading = false;
  showCreateModal = false;
  showEditModal = false;
  selectedExam: ExamSummary | null = null;

  // Toast notification
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  // Form data
  examForm: CreateExamRequest = {
    title: '',
    level: ExamLevel.A1,
    description: '',
    totalDuration: 90,
    passingScore: 60
  };

  levels = Object.values(ExamLevel);

  constructor(private examService: ExamService, private router: Router) {}

  ngOnInit(): void {
    this.loadExams();
  }

  loadExams(): void {
    this.loading = true;
    this.examService.getAllExams().subscribe({
      next: (exams) => {
        // Sort: Published first, then drafts
        this.exams = exams.sort((a, b) => {
          if (a.isPublished === b.isPublished) {
            return 0;
          }
          return a.isPublished ? -1 : 1;
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading exams:', error);
        this.loading = false;
        alert('Failed to load exams');
      }
    });
  }

  openCreateModal(): void {
    // Navigate to exam builder
    this.router.navigate(['/dashboard/exams/create']);
  }

  openEditModal(exam: ExamSummary): void {
    // Navigate to exam builder for editing
    this.router.navigate(['/dashboard/exams/edit', exam.id]);
  }

  deleteExam(exam: ExamSummary): void {
    if (!confirm(`Are you sure you want to delete "${exam.title}"?`)) {
      return;
    }

    this.examService.deleteExam(exam.id).subscribe({
      next: () => {
        alert('Exam deleted successfully!');
        this.loadExams();
      },
      error: (error) => {
        console.error('Error deleting exam:', error);
        alert('Failed to delete exam');
      }
    });
  }

  togglePublish(exam: ExamSummary): void {
    const action = exam.isPublished ? 'unpublish' : 'publish';

    const request = exam.isPublished 
      ? this.examService.unpublishExam(exam.id)
      : this.examService.publishExam(exam.id);

    request.subscribe({
      next: () => {
        // Update the exam status locally without reloading
        exam.isPublished = !exam.isPublished;
        // Re-sort the list
        this.exams = this.exams.sort((a, b) => {
          if (a.isPublished === b.isPublished) {
            return 0;
          }
          return a.isPublished ? -1 : 1;
        });
        // Show success toast
        this.showToastNotification(
          exam.isPublished ? 'Exam published successfully!' : 'Exam unpublished successfully!',
          'success'
        );
      },
      error: (error) => {
        console.error(`Error ${action}ing exam:`, error);
        this.showToastNotification(`Failed to ${action} exam`, 'error');
      }
    });
  }

  showToastNotification(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  getLevelColor(level: ExamLevel): string {
    const colors: Record<ExamLevel, string> = {
      [ExamLevel.A1]: 'bg-green-100 text-green-800',
      [ExamLevel.A2]: 'bg-blue-100 text-blue-800',
      [ExamLevel.B1]: 'bg-yellow-100 text-yellow-800',
      [ExamLevel.B2]: 'bg-orange-100 text-orange-800',
      [ExamLevel.C1]: 'bg-red-100 text-red-800',
      [ExamLevel.C2]: 'bg-purple-100 text-purple-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  }
}
