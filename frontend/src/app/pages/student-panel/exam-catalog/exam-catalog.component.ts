import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ExamService } from '../../../core/services/exam.service';
import { AuthService } from '../../../core/services/auth.service';
import { ExamLevel } from '../../../core/models/exam.model';

interface LevelInfo {
  level: ExamLevel;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  icon: string;
  skills: string[];
}

@Component({
  selector: 'app-exam-catalog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exam-catalog.component.html',
  styleUrls: ['./exam-catalog.component.scss']
})
export class ExamCatalogComponent implements OnInit {
  loading = false;
  startingExam = false;
  
  levels: LevelInfo[] = [
    {
      level: ExamLevel.A1,
      title: 'A1 - Beginner',
      description: 'Can understand and use familiar everyday expressions and very basic phrases.',
      color: '#10b981',
      bgColor: '#d1fae5',
      icon: '🌱',
      skills: ['Basic greetings', 'Simple questions', 'Personal information']
    },
    {
      level: ExamLevel.A2,
      title: 'A2 - Elementary',
      description: 'Can communicate in simple and routine tasks requiring direct exchange of information.',
      color: '#3b82f6',
      bgColor: '#dbeafe',
      icon: '📚',
      skills: ['Shopping', 'Local geography', 'Employment']
    },
    {
      level: ExamLevel.B1,
      title: 'B1 - Intermediate',
      description: 'Can deal with most situations likely to arise while traveling in an area where the language is spoken.',
      color: '#f59e0b',
      bgColor: '#fef3c7',
      icon: '🎯',
      skills: ['Travel situations', 'Personal experiences', 'Dreams and ambitions']
    },
    {
      level: ExamLevel.B2,
      title: 'B2 - Upper Intermediate',
      description: 'Can interact with a degree of fluency and spontaneity with native speakers.',
      color: '#f97316',
      bgColor: '#ffedd5',
      icon: '🚀',
      skills: ['Complex texts', 'Technical discussions', 'Detailed arguments']
    },
    {
      level: ExamLevel.C1,
      title: 'C1 - Advanced',
      description: 'Can express ideas fluently and spontaneously without much obvious searching for expressions.',
      color: '#ef4444',
      bgColor: '#fee2e2',
      icon: '⭐',
      skills: ['Academic texts', 'Professional contexts', 'Implicit meaning']
    },
    {
      level: ExamLevel.C2,
      title: 'C2 - Proficiency',
      description: 'Can understand with ease virtually everything heard or read.',
      color: '#8b5cf6',
      bgColor: '#ede9fe',
      icon: '👑',
      skills: ['Native-like fluency', 'Subtle distinctions', 'Complex subjects']
    }
  ];

  constructor(
    private examService: ExamService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // No need to load exams, just show levels
  }

  startExam(level: ExamLevel): void {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !currentUser.id) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.startingExam) {
      return; // Prevent double clicks
    }

    this.startingExam = true;

    // The backend will randomly select an exam at this level
    this.examService.startExam(currentUser.id, level).subscribe({
      next: (attempt) => {
        this.router.navigate(['/user-panel/exam-taking', attempt.id]);
      },
      error: (error) => {
        console.error('Error starting exam:', error);
        alert('Failed to start exam. Please try again.');
        this.startingExam = false;
      }
    });
  }
}
