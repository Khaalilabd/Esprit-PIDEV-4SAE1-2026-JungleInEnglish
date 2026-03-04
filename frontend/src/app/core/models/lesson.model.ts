export enum LessonType {
  VIDEO = 'VIDEO',
  TEXT = 'TEXT',
  QUIZ = 'QUIZ',
  ASSIGNMENT = 'ASSIGNMENT',
  DOCUMENT = 'DOCUMENT',
  INTERACTIVE = 'INTERACTIVE'
}

export interface Lesson {
  id?: number;
  title: string;
  description: string;
  content?: string;
  contentUrl?: string;
  lessonType: LessonType;
  orderIndex: number;
  duration?: number;
  isPreview: boolean;
  isPublished: boolean;
  chapterId: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLessonRequest {
  title: string;
  description: string;
  content?: string;
  contentUrl?: string;
  lessonType: LessonType;
  orderIndex: number;
  duration?: number;
  isPreview: boolean;
  isPublished: boolean;
  chapterId: number;
}

export interface UpdateLessonRequest {
  title: string;
  description: string;
  content?: string;
  contentUrl?: string;
  lessonType: LessonType;
  orderIndex: number;
  duration?: number;
  isPreview: boolean;
  isPublished: boolean;
  chapterId: number;
}
