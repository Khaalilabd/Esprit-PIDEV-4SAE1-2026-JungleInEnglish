export enum ExamLevel {
  A1 = 'A1',
  A2 = 'A2',
  B1 = 'B1',
  B2 = 'B2',
  C1 = 'C1',
  C2 = 'C2'
}

export enum PartType {
  VOCABULARY = 'VOCABULARY',
  GRAMMAR = 'GRAMMAR',
  READING = 'READING',
  LISTENING = 'LISTENING',
  WRITING = 'WRITING',
  WORD_ORDERING = 'WORD_ORDERING',
  FILL_IN_GAP = 'FILL_IN_GAP',
  MATCHING = 'MATCHING',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE'
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  FILL_IN_GAP = 'FILL_IN_GAP',
  WORD_ORDERING = 'WORD_ORDERING',
  OPEN_WRITING = 'OPEN_WRITING',
  MATCHING = 'MATCHING',
  TRUE_FALSE = 'TRUE_FALSE',
  DROPDOWN_SELECT = 'DROPDOWN_SELECT',
  AUDIO_RESPONSE = 'AUDIO_RESPONSE'
}

export enum AttemptStatus {
  STARTED = 'STARTED',
  SUBMITTED = 'SUBMITTED',
  GRADED = 'GRADED',
  EXPIRED = 'EXPIRED'
}

export enum GradingMode {
  AUTO = 'AUTO',
  MANUAL = 'MANUAL',
  HYBRID = 'HYBRID'
}

export interface ExamSummary {
  id: string;
  title: string;
  level: ExamLevel;
  description: string;
  totalDuration: number;
  passingScore: number;
  isPublished: boolean;
  partCount: number;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionOption {
  id: string;
  label: string;
  orderIndex: number;
}

export interface Question {
  id: string;
  questionType: QuestionType;
  prompt: string;
  mediaUrl?: string;
  orderIndex: number;
  points: number;
  explanation?: string;
  metadata?: any;
  options?: QuestionOption[];
}

export interface ExamPart {
  id: string;
  title: string;
  partType: PartType;
  instructions?: string;
  orderIndex: number;
  timeLimit?: number;
  audioUrl?: string;
  readingText?: string;
  questions: Question[];
}

export interface ExamDetail {
  id: string;
  title: string;
  level: ExamLevel;
  description: string;
  totalDuration: number;
  passingScore: number;
  isPublished: boolean;
  parts: ExamPart[];
  createdAt: string;
  updatedAt: string;
}

export interface ExamAttempt {
  id: string;
  userId: number;
  examId: string;
  startedAt: string;
  submittedAt?: string;
  status: AttemptStatus;
  totalScore?: number;
  percentageScore?: number;
  passed?: boolean;
  timeSpent?: number;
  gradingMode: GradingMode;
}

export interface ExamAttemptWithExam {
  id: string;
  userId: number;
  exam: ExamDetail;
  startedAt: string;
  submittedAt?: string;
  status: AttemptStatus;
  totalScore?: number;
  percentageScore?: number;
  passed?: boolean;
  timeSpent?: number;
  gradingMode: GradingMode;
  answers?: StudentAnswer[];
}

export interface StudentAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  answerData?: string;
  score?: number;
  feedback?: string;
  isGraded: boolean;
  graderId?: number;
  gradedAt?: string;
}

export interface AnswerItem {
  questionId: string;
  answerData: any;
}

export interface SaveAnswersRequest {
  answers: AnswerItem[];
}

export interface ExamResult {
  id: string;
  userId: number;
  attemptId: string;
  level: ExamLevel;
  totalScore: number;
  percentageScore: number;
  passed: boolean;
  partBreakdown: any;
  cefrBand?: ExamLevel;
  certificate?: string;
  createdAt: string;
}

export interface QuestionReview {
  questionId: string;
  questionType: QuestionType;
  prompt: string;
  studentAnswer: any;
  correctAnswer: any;
  isCorrect?: boolean;
  score?: number;
  maxPoints: number;
  explanation?: string;
  manualFeedback?: string;
}

export interface ResultWithReview extends ExamResult {
  questionReviews: QuestionReview[];
}
