export interface ChapterProgress {
  id?: number;
  studentId: number;
  chapterId: number;
  chapterTitle?: string;
  isCompleted: boolean;
  startedAt?: Date;
  completedAt?: Date;
  lastAccessedAt?: Date;
  completedLessons: number;
  totalLessons: number;
  progressPercentage: number;
}
