import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamService } from '../../../core/services/exam.service';
import { 
  ExamLevel, 
  PartType, 
  QuestionType, 
  ExamDetail,
  ExamPart,
  Question,
  QuestionOption 
} from '../../../core/models/exam.model';

interface ExamFormData {
  title: string;
  level: ExamLevel;
  description: string;
  totalDuration: number;
  passingScore: number;
}

interface PartFormData {
  title: string;
  partType: PartType;
  instructions: string;
  timeLimit: number | null;
  audioUrl: string;
  readingText: string;
  orderIndex: number;
}

interface QuestionFormData {
  questionType: QuestionType;
  prompt: string;
  mediaUrl: string;
  points: number;
  explanation: string;
  orderIndex: number;
  metadata: any;
  options: QuestionOption[];
  correctAnswer: any;
}

@Component({
  selector: 'app-exam-builder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exam-builder.component.html',
  styleUrl: './exam-builder.component.scss'
})
export class ExamBuilderComponent implements OnInit {
  // Wizard steps
  currentStep = 1;
  totalSteps = 3;

  // Exam data
  examId: string | null = null;
  isEditMode = false;
  
  examForm: ExamFormData = {
    title: '',
    level: ExamLevel.A1,
    description: '',
    totalDuration: 90,
    passingScore: 60
  };

  parts: PartFormData[] = [];
  currentPartIndex = 0;
  
  questions: Map<number, QuestionFormData[]> = new Map();
  currentQuestionIndex = 0;

  // Enums for dropdowns
  levels = Object.values(ExamLevel);
  partTypes = Object.values(PartType);
  questionTypes = Object.values(QuestionType);

  // UI state
  loading = false;
  saving = false;
  showPartModal = false;
  showQuestionModal = false;
  editingPartIndex: number | null = null;
  editingQuestionIndex: number | null = null;

  // Form for modals
  partForm: PartFormData = this.getEmptyPartForm();
  questionForm: QuestionFormData = this.getEmptyQuestionForm();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private examService: ExamService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.examId = id;
      this.isEditMode = true;
      this.loadExam(id);
    }
  }

  loadExam(id: string): void {
    this.loading = true;
    this.examService.getExamById(id).subscribe({
      next: (exam) => {
        this.examForm = {
          title: exam.title,
          level: exam.level,
          description: exam.description,
          totalDuration: exam.totalDuration,
          passingScore: exam.passingScore
        };
        
        this.parts = exam.parts.map(part => ({
          title: part.title,
          partType: part.partType,
          instructions: part.instructions || '',
          timeLimit: part.timeLimit || null,
          audioUrl: part.audioUrl || '',
          readingText: part.readingText || '',
          orderIndex: part.orderIndex
        }));

        exam.parts.forEach((part, partIndex) => {
          const questionsForPart = part.questions.map(q => ({
            questionType: q.questionType,
            prompt: q.prompt,
            mediaUrl: q.mediaUrl || '',
            points: q.points,
            explanation: q.explanation || '',
            orderIndex: q.orderIndex,
            metadata: q.metadata || {},
            options: q.options || [],
            correctAnswer: this.extractCorrectAnswer(q)
          }));
          this.questions.set(partIndex, questionsForPart);
        });

        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading exam:', error);
        alert('Failed to load exam');
        this.router.navigate(['/dashboard/exams']);
      }
    });
  }

  extractCorrectAnswer(question: Question): any {
    if (!question.metadata) return null;
    return question.metadata.correctAnswer || question.metadata.correct_answer || null;
  }

  // Step navigation
  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      if (this.validateCurrentStep()) {
        this.currentStep++;
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step;
    }
  }

  validateCurrentStep(): boolean {
    switch (this.currentStep) {
      case 1:
        if (!this.examForm.title || !this.examForm.description) {
          alert('Please fill in exam title and description');
          return false;
        }
        return true;
      case 2:
        if (this.parts.length === 0) {
          alert('Please add at least one part to the exam');
          return false;
        }
        return true;
      case 3:
        for (let i = 0; i < this.parts.length; i++) {
          const partQuestions = this.questions.get(i) || [];
          if (partQuestions.length === 0) {
            alert(`Part "${this.parts[i].title}" has no questions. Please add at least one question to each part.`);
            return false;
          }
        }
        return true;
      default:
        return true;
    }
  }

  // Part management
  getEmptyPartForm(): PartFormData {
    return {
      title: '',
      partType: PartType.VOCABULARY,
      instructions: '',
      timeLimit: null,
      audioUrl: '',
      readingText: '',
      orderIndex: this.parts.length
    };
  }

  openAddPartModal(): void {
    this.partForm = this.getEmptyPartForm();
    this.editingPartIndex = null;
    this.showPartModal = true;
  }

  openEditPartModal(index: number): void {
    this.partForm = { ...this.parts[index] };
    this.editingPartIndex = index;
    this.showPartModal = true;
  }

  closePartModal(): void {
    this.showPartModal = false;
    this.editingPartIndex = null;
  }

  savePart(): void {
    if (!this.partForm.title) {
      alert('Please enter a part title');
      return;
    }

    if (this.editingPartIndex !== null) {
      this.parts[this.editingPartIndex] = { ...this.partForm };
    } else {
      this.parts.push({ ...this.partForm });
      this.questions.set(this.parts.length - 1, []);
    }

    this.closePartModal();
  }

  deletePart(index: number): void {
    if (!confirm(`Delete part "${this.parts[index].title}"? All questions in this part will be deleted.`)) {
      return;
    }

    this.parts.splice(index, 1);
    this.questions.delete(index);
    
    // Reindex
    const newQuestions = new Map<number, QuestionFormData[]>();
    this.questions.forEach((qs, oldIndex) => {
      if (oldIndex > index) {
        newQuestions.set(oldIndex - 1, qs);
      } else if (oldIndex < index) {
        newQuestions.set(oldIndex, qs);
      }
    });
    this.questions = newQuestions;
  }

  movePartUp(index: number): void {
    if (index > 0) {
      [this.parts[index], this.parts[index - 1]] = [this.parts[index - 1], this.parts[index]];
      const temp = this.questions.get(index);
      this.questions.set(index, this.questions.get(index - 1) || []);
      this.questions.set(index - 1, temp || []);
    }
  }

  movePartDown(index: number): void {
    if (index < this.parts.length - 1) {
      [this.parts[index], this.parts[index + 1]] = [this.parts[index + 1], this.parts[index]];
      const temp = this.questions.get(index);
      this.questions.set(index, this.questions.get(index + 1) || []);
      this.questions.set(index + 1, temp || []);
    }
  }

  // Question management
  getEmptyQuestionForm(): QuestionFormData {
    return {
      questionType: QuestionType.MULTIPLE_CHOICE,
      prompt: '',
      mediaUrl: '',
      points: 1,
      explanation: '',
      orderIndex: 0,
      metadata: {},
      options: [],
      correctAnswer: null
    };
  }

  openAddQuestionModal(partIndex: number): void {
    this.currentPartIndex = partIndex;
    const partQuestions = this.questions.get(partIndex) || [];
    this.questionForm = this.getEmptyQuestionForm();
    this.questionForm.orderIndex = partQuestions.length;
    this.editingQuestionIndex = null;
    this.showQuestionModal = true;
  }

  openEditQuestionModal(partIndex: number, questionIndex: number): void {
    this.currentPartIndex = partIndex;
    const partQuestions = this.questions.get(partIndex) || [];
    this.questionForm = { ...partQuestions[questionIndex] };
    this.editingQuestionIndex = questionIndex;
    this.showQuestionModal = true;
  }

  closeQuestionModal(): void {
    this.showQuestionModal = false;
    this.editingQuestionIndex = null;
  }

  saveQuestion(): void {
    if (!this.questionForm.prompt) {
      alert('Please enter a question prompt');
      return;
    }

    // Validate based on question type
    if (this.requiresOptions(this.questionForm.questionType) && this.questionForm.options.length === 0) {
      alert('Please add at least one option for this question type');
      return;
    }

    const partQuestions = this.questions.get(this.currentPartIndex) || [];
    
    if (this.editingQuestionIndex !== null) {
      partQuestions[this.editingQuestionIndex] = { ...this.questionForm };
    } else {
      partQuestions.push({ ...this.questionForm });
    }

    this.questions.set(this.currentPartIndex, partQuestions);
    this.closeQuestionModal();
  }

  deleteQuestion(partIndex: number, questionIndex: number): void {
    const partQuestions = this.questions.get(partIndex) || [];
    if (!confirm(`Delete this question?`)) {
      return;
    }

    partQuestions.splice(questionIndex, 1);
    this.questions.set(partIndex, partQuestions);
  }

  // Question options management
  addOption(): void {
    this.questionForm.options.push({
      id: `temp-${Date.now()}`,
      label: '',
      orderIndex: this.questionForm.options.length
    });
  }

  removeOption(index: number): void {
    this.questionForm.options.splice(index, 1);
  }

  requiresOptions(type: QuestionType): boolean {
    return [
      QuestionType.MULTIPLE_CHOICE,
      QuestionType.DROPDOWN_SELECT
    ].includes(type);
  }

  // Save exam
  async saveExam(): Promise<void> {
    if (!this.validateCurrentStep()) {
      return;
    }

    this.saving = true;

    try {
      // Step 1: Create or update exam
      let examId = this.examId;
      
      if (!examId) {
        const examResponse = await this.examService.createExam(this.examForm).toPromise();
        examId = examResponse!.id;
      } else {
        await this.examService.updateExam(examId, this.examForm).toPromise();
      }

      // Step 2: Create parts and questions
      for (let partIndex = 0; partIndex < this.parts.length; partIndex++) {
        const partData = this.parts[partIndex];
        
        // Create part
        const partPayload = {
          title: partData.title,
          partType: partData.partType,
          instructions: partData.instructions || null,
          orderIndex: partIndex,
          timeLimit: partData.timeLimit || null,
          audioUrl: partData.audioUrl || null,
          readingText: partData.readingText || null
        };

        const createdPart = await this.examService.createPart(examId, partPayload).toPromise();
        const partId = createdPart!.id;

        // Create questions for this part
        const partQuestions = this.questions.get(partIndex) || [];
        for (let questionIndex = 0; questionIndex < partQuestions.length; questionIndex++) {
          const questionData = partQuestions[questionIndex];
          
          // Prepare question payload
          const questionPayload: any = {
            questionType: questionData.questionType,
            prompt: questionData.prompt,
            mediaUrl: questionData.mediaUrl || null,
            orderIndex: questionIndex,
            points: questionData.points,
            explanation: questionData.explanation || null,
            metadata: questionData.metadata || {}
          };

          // Add options if present
          if (questionData.options && questionData.options.length > 0) {
            questionPayload.options = questionData.options.map((opt, idx) => ({
              label: opt.label,
              orderIndex: idx,
              isCorrect: opt.id === questionData.correctAnswer || false
            }));
          }

          // Add correct answer
          if (questionData.correctAnswer !== null && questionData.correctAnswer !== undefined) {
            questionPayload.correctAnswer = {
              answerData: this.formatCorrectAnswer(questionData)
            };
          }

          await this.examService.createQuestion(partId, questionPayload).toPromise();
        }
      }

      alert('Exam created successfully with all parts and questions!');
      this.router.navigate(['/dashboard/exams']);
    } catch (error) {
      console.error('Error saving exam:', error);
      alert('Failed to save exam: ' + (error as any)?.error?.message || 'Unknown error');
    } finally {
      this.saving = false;
    }
  }

  private formatCorrectAnswer(questionData: QuestionFormData): any {
    const type = questionData.questionType;
    const answer = questionData.correctAnswer;

    switch (type) {
      case QuestionType.MULTIPLE_CHOICE:
      case QuestionType.DROPDOWN_SELECT:
        // For these types, correctAnswer is the option ID
        return { optionId: answer };
      
      case QuestionType.TRUE_FALSE:
        // Boolean value
        return { value: answer };
      
      case QuestionType.FILL_IN_GAP:
        // Text or array of texts
        return { text: answer };
      
      case QuestionType.WORD_ORDERING:
        // Array of words in correct order
        return { order: answer };
      
      case QuestionType.MATCHING:
        // Array of pairs
        return { pairs: answer };
      
      case QuestionType.OPEN_WRITING:
      case QuestionType.AUDIO_RESPONSE:
        // These don't have predefined correct answers
        return { rubric: answer || null };
      
      default:
        return answer;
    }
  }

  cancel(): void {
    if (confirm('Discard changes and return to exam list?')) {
      this.router.navigate(['/dashboard/exams']);
    }
  }

  getPartQuestions(partIndex: number): QuestionFormData[] {
    return this.questions.get(partIndex) || [];
  }

  getTotalQuestions(): number {
    let total = 0;
    this.questions.forEach(qs => total += qs.length);
    return total;
  }

  getQuestionTypeLabel(type: QuestionType): string {
    const labels: Record<QuestionType, string> = {
      [QuestionType.MULTIPLE_CHOICE]: 'Multiple Choice',
      [QuestionType.TRUE_FALSE]: 'True/False',
      [QuestionType.FILL_IN_GAP]: 'Fill in the Gap',
      [QuestionType.WORD_ORDERING]: 'Word Ordering',
      [QuestionType.MATCHING]: 'Matching',
      [QuestionType.DROPDOWN_SELECT]: 'Dropdown Select',
      [QuestionType.OPEN_WRITING]: 'Open Writing',
      [QuestionType.AUDIO_RESPONSE]: 'Audio Response'
    };
    return labels[type] || type;
  }
}
