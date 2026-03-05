import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';
import { EcommerceComponent } from './pages/dashboard/ecommerce/ecommerce.component';
import { CalenderComponent } from './pages/calender/calender.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { FormElementsComponent } from './pages/forms/form-elements/form-elements.component';
import { BasicTablesComponent } from './pages/tables/basic-tables/basic-tables.component';
import { BlankComponent } from './pages/blank/blank.component';
import { InvoicesComponent } from './pages/invoices/invoices.component';
import { LineChartComponent } from './pages/charts/line-chart/line-chart.component';
import { BarChartComponent } from './pages/charts/bar-chart/bar-chart.component';
import { AlertsComponent } from './pages/ui-elements/alerts/alerts.component';
import { AvatarElementComponent } from './pages/ui-elements/avatar-element/avatar-element.component';
import { BadgesComponent } from './pages/ui-elements/badges/badges.component';
import { ButtonsComponent } from './pages/ui-elements/buttons/buttons.component';
import { ImagesComponent } from './pages/ui-elements/images/images.component';
import { VideosComponent } from './pages/ui-elements/videos/videos.component';
import { SignInComponent } from './pages/auth-pages/sign-in/sign-in.component';
import { SignUpComponent } from './pages/auth-pages/sign-up/sign-up.component';
import { NotFoundComponent } from './pages/other-page/not-found/not-found.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { ActivateComponent } from './auth/activate/activate.component';
import { OAuth2CallbackComponent } from './auth/oauth2-callback/oauth2-callback.component';
import { StudentLayoutComponent } from './shared/layout/student-layout/student-layout.component';
import { TutorLayoutComponent } from './shared/layout/tutor-layout/tutor-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { LessonManagementComponent } from './pages/tutor-panel/lesson-management/lesson-management.component';
import { roleGuard } from './core/guards/role.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  // Page d'accueil Jungle in English
  {
    path: '',
    component: HomeComponent
  },
  
  // Page publique des clubs
  {
    path: 'clubs',
    loadComponent: () => import('./pages/public-clubs/public-clubs.component').then(m => m.PublicClubsComponent),
    title: 'Clubs | Jungle in English'
  },
  
  // Page publique des événements
  {
    path: 'events',
    loadComponent: () => import('./pages/public-events/public-events.component').then(m => m.PublicEventsComponent),
    title: 'Events | Jungle in English'
  },
  
  // Pack Details - Page publique
  {
    path: 'pack-details/:id',
    loadComponent: () => import('./pages/pack-details/pack-details.component').then(m => m.PackDetailsComponent),
    title: 'Pack Details | Jungle in English'
  },
  
  // Ebook Reader - Standalone (no sidebar)
  {
    path: 'ebook-reader/:id',
    loadComponent: () => import('./pages/student-panel/ebook-reader/ebook-reader.component').then(m => m.EbookReaderComponent),
    canActivate: [authGuard],
    title: 'Read Ebook | Jungle in English'
  },
  
  // Student Panel avec layout et sidebar - Protégé pour STUDENT uniquement
  {
    path: 'user-panel',
    component: StudentLayoutComponent,
    canActivate: [roleGuard(['STUDENT'])],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/student-panel/student-panel.component').then(m => m.StudentPanelComponent),
        title: 'My Dashboard | Jungle in English'
      },
      {
        path: 'courses',
        loadComponent: () => import('./pages/student-panel/courses/courses.component').then(m => m.CoursesComponent),
        title: 'My Courses (Old) | Jungle in English'
      },
      {
        path: 'my-courses',
        loadComponent: () => import('./pages/student-panel/my-courses/my-courses.component').then(m => m.MyCoursesComponent),
        title: 'My Courses | Jungle in English'
      },
      {
        path: 'course-catalog',
        loadComponent: () => import('./pages/student-panel/course-catalog/course-catalog.component').then(m => m.CourseCatalogComponent),
        title: 'Explore Courses | Jungle in English'
      },
      {
        path: 'pack-catalog',
        loadComponent: () => import('./pages/student-panel/pack-catalog/pack-catalog.component').then(m => m.PackCatalogComponent),
        title: 'Browse Packs | Jungle in English'
      },
      {
        path: 'pack-details/:id',
        loadComponent: () => import('./pages/pack-details/pack-details.component').then(m => m.PackDetailsComponent),
        title: 'Pack Details | Jungle in English'
      },
      {
        path: 'my-packs',
        loadComponent: () => import('./pages/student-panel/my-packs/my-packs.component').then(m => m.MyPacksComponent),
        title: 'My Packs | Jungle in English'
      },
      {
        path: 'pack/:packId/learning',
        loadComponent: () => import('./pages/student-panel/pack-courses/pack-courses.component').then(m => m.PackCoursesComponent),
        title: 'My Courses | Jungle in English'
      },
      {
        path: 'course/:courseId/learning',
        loadComponent: () => import('./pages/student-panel/course-learning/course-learning.component').then(m => m.CourseLearningComponent),
        title: 'Course Learning | Jungle in English'
      },
      {
        path: 'course/:id',
        loadComponent: () => import('./pages/student-panel/course-view/course-view.component').then(m => m.CourseViewComponent),
        title: 'Course Details | Jungle in English'
      },
      {
        path: 'lesson/:id',
        loadComponent: () => import('./pages/student-panel/lesson-viewer/lesson-viewer.component').then(m => m.LessonViewerComponent),
        title: 'Lesson | Jungle in English'
      },
      {
        path: 'schedule',
        loadComponent: () => import('./pages/student-panel/schedule/schedule.component').then(m => m.ScheduleComponent),
        title: 'My Schedule | Jungle in English'
      },
      {
        path: 'messages',
        loadComponent: () => import('./pages/student-panel/messages/messages.component').then(m => m.MessagesComponent),
        title: 'Messages | Jungle in English'
      },
      {
        path: 'assignments',
        loadComponent: () => import('./pages/student-panel/assignments/assignments.component').then(m => m.AssignmentsComponent),
        title: 'Assignments | Jungle in English'
      },
      {
        path: 'grades',
        loadComponent: () => import('./pages/student-panel/grades/grades.component').then(m => m.GradesComponent),
        title: 'My Grades | Jungle in English'
      },
      {
        path: 'quizzes',
        loadComponent: () => import('./pages/student-panel/quizzes/quizzes.component').then(m => m.QuizzesComponent),
        title: 'Quizzes | Jungle in English'
      },
      {
        path: 'ebooks',
        loadComponent: () => import('./pages/student-panel/ebooks/ebooks.component').then(m => m.EbooksComponent),
        title: 'Ebooks | Jungle in English'
      },
      {
        path: 'ebooks/read/:id',
        loadComponent: () => import('./pages/student-panel/ebook-reader/ebook-reader.component').then(m => m.EbookReaderComponent),
        title: 'Read Ebook | Jungle in English'
      },
      {
        path: 'exams',
        loadComponent: () => import('./pages/student-panel/exam-catalog/exam-catalog.component').then(m => m.ExamCatalogComponent),
        title: 'CEFR Exams | Jungle in English'
      },
      {
        path: 'exam-taking/:attemptId',
        loadComponent: () => import('./pages/student-panel/exam-taking/exam-taking.component').then(m => m.ExamTakingComponent),
        title: 'Taking Exam | Jungle in English'
      },
      {
        path: 'exam-result/:attemptId',
        loadComponent: () => import('./pages/student-panel/exam-result/exam-result.component').then(m => m.ExamResultComponent),
        title: 'Exam Result | Jungle in English'
      },
      {
        path: 'my-exam-results',
        loadComponent: () => import('./pages/student-panel/my-exam-results/my-exam-results.component').then(m => m.MyExamResultsComponent),
        title: 'My Exam Results | Jungle in English'
      },
      {
        path: 'clubs',
        loadComponent: () => import('./pages/student-panel/clubs/clubs.component').then(m => m.ClubsComponent),
        title: 'My Clubs | Jungle in English'
      },
      {
        path: 'clubs/:id',
        loadComponent: () => import('./pages/student-panel/clubs/clubs.component').then(m => m.ClubsComponent),
        title: 'Club Details | Jungle in English'
      },
      {
        path: 'events',
        loadComponent: () => import('./pages/student-panel/events/events.component').then(m => m.EventsComponent),
        title: 'Events | Jungle in English'
      },
      {
        path: 'events/:id',
        loadComponent: () => import('./pages/student-panel/events/events.component').then(m => m.EventsComponent),
        title: 'Event Details | Jungle in English'
      },
      {
        path: 'club-requests',
        loadComponent: () => import('./pages/student-panel/club-requests/club-requests.component').then(m => m.ClubRequestsComponent),
        title: 'Club Requests | Jungle in English'
      },
      {
        path: 'progress',
        loadComponent: () => import('./pages/student-panel/progress/progress.component').then(m => m.ProgressComponent),
        title: 'My Progress | Jungle in English'
      },
      {
        path: 'forum',
        loadComponent: () => import('./pages/student-panel/forum/forum.component').then(m => m.ForumComponent),
        title: 'Community Forum | Jungle in English'
      },
      {
        path: 'forum/topics/:subCategoryId/:subCategoryName',
        loadComponent: () => import('./pages/student-panel/forum/topic-list/topic-list.component').then(m => m.TopicListComponent),
        title: 'Topics | Jungle in English'
      },
      {
        path: 'forum/topic/:topicId',
        loadComponent: () => import('./pages/student-panel/forum/topic-detail/topic-detail.component').then(m => m.TopicDetailComponent),
        title: 'Topic Details | Jungle in English'
      },
      {
        path: 'subscription',
        loadComponent: () => import('./pages/student-panel/subscription/subscription.component').then(m => m.SubscriptionComponent),
        title: 'My Subscription | Jungle in English'
      },
      {
        path: 'support',
        loadComponent: () => import('./pages/student-panel/support/support.component').then(m => m.SupportComponent),
        title: 'Help & Support | Jungle in English'
      },
      {
        path: 'complaints',
        loadComponent: () => import('./pages/student-panel/complaints/complaints.component').then(m => m.ComplaintsComponent),
        title: 'Complaints | Jungle in English'
      },
      {
        path: 'complaints/:id',
        loadComponent: () => import('./pages/student-panel/complaints/complaint-detail/complaint-detail.component').then(m => m.StudentComplaintDetailComponent),
        title: 'Complaint Details | Jungle in English'
      },
      {
        path: 'complaints/edit/:id',
        loadComponent: () => import('./pages/student-panel/complaints/edit-complaint/edit-complaint.component').then(m => m.EditComplaintComponent),
        title: 'Edit Complaint | Jungle in English'
      },
      {
        path: 'sessions',
        loadComponent: () => import('./pages/student-panel/sessions/sessions.component').then(m => m.SessionsComponent),
        title: 'My Sessions | Jungle in English'
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/student-panel/settings/settings.component').then(m => m.StudentSettingsComponent),
        title: 'Settings | Jungle in English'
      }
    ]
  },
  
  // Tutor Panel avec layout et sidebar - Protégé pour TUTOR et TEACHER
  {
    path: 'tutor-panel',
    component: TutorLayoutComponent,
    canActivate: [roleGuard(['TUTOR', 'TEACHER'])],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/tutor-panel/tutor-panel.component').then(m => m.TutorPanelComponent),
        title: 'Tutor Dashboard | Jungle in English'
      },
      {
        path: 'courses',
        loadComponent: () => import('./pages/tutor-panel/course-list/course-list.component').then(m => m.CourseListComponent),
        title: 'My Courses | Jungle in English'
      },
      {
        path: 'my-students',
        loadComponent: () => import('./pages/tutor-panel/my-students/my-students.component').then(m => m.MyStudentsComponent),
        title: 'My Students | Jungle in English'
      },
      {
        path: 'availability',
        loadComponent: () => import('./pages/tutor-panel/tutor-availability/tutor-availability.component').then(m => m.TutorAvailabilityComponent),
        title: 'My Availability | Jungle in English'
      },
      {
        path: 'courses/create',
        loadComponent: () => import('./pages/tutor-panel/course-create/course-create.component').then(m => m.CourseCreateComponent),
        title: 'Create Course | Jungle in English'
      },
      {
        path: 'courses/:id',
        loadComponent: () => import('./pages/tutor-panel/course-view/course-view.component').then(m => m.CourseViewComponent),
        title: 'Course Details | Jungle in English'
      },
      {
        path: 'courses/edit/:id',
        loadComponent: () => import('./pages/tutor-panel/course-edit/course-edit.component').then(m => m.CourseEditComponent),
        title: 'Edit Course | Jungle in English'
      },
      {
        path: 'courses/:courseId/chapters',
        loadComponent: () => import('./pages/tutor-panel/chapter-management/chapter-management.component').then(m => m.ChapterManagementComponent),
        title: 'Manage Chapters | Jungle in English'
      },
      {
        path: 'courses/:courseId/chapters/:chapterId/lessons',
        component: LessonManagementComponent,
        title: 'Manage Lessons | Jungle in English'
      },
      {
        path: 'quiz-management',
        loadComponent: () => import('./pages/tutor-panel/quiz-management/quiz-management.component').then(m => m.QuizManagementComponent),
        title: 'Quiz Management | Jungle in English'
      },
      {
        path: 'quiz-management/create',
        loadComponent: () => import('./pages/tutor-panel/quiz-create/quiz-create.component').then(m => m.QuizCreateComponent),
        title: 'Create Quiz | Jungle in English'
      },
      {
        path: 'quiz-management/edit/:id',
        loadComponent: () => import('./pages/tutor-panel/quiz-create/quiz-create.component').then(m => m.QuizCreateComponent),
        title: 'Edit Quiz | Jungle in English'
      },
      {
        path: 'ebooks',
        loadComponent: () => import('./pages/student-panel/ebooks/ebooks.component').then(m => m.EbooksComponent),
        title: 'Ebooks | Jungle in English'
      },
      {
        path: 'schedule',
        loadComponent: () => import('./pages/student-panel/schedule/schedule.component').then(m => m.ScheduleComponent),
        title: 'Schedule | Jungle in English'
      },
      {
        path: 'students',
        loadComponent: () => import('./pages/tutor-panel/my-students/my-students.component').then(m => m.MyStudentsComponent),
        title: 'My Students | Jungle in English'
      },
      {
        path: 'assignments',
        loadComponent: () => import('./pages/student-panel/assignments/assignments.component').then(m => m.AssignmentsComponent),
        title: 'Assignments | Jungle in English'
      },
      {
        path: 'analytics',
        loadComponent: () => import('./pages/student-panel/progress/progress.component').then(m => m.ProgressComponent),
        title: 'Analytics | Jungle in English'
      },
      {
        path: 'messages',
        loadComponent: () => import('./pages/student-panel/messages/messages.component').then(m => m.MessagesComponent),
        title: 'Messages | Jungle in English'
      },
      {
        path: 'complaints',
        loadComponent: () => import('./pages/tutor-panel/complaints/complaints.component').then(m => m.ComplaintsComponent),
        title: 'Manage Complaints | Jungle in English'
      },
      {
        path: 'complaints/:id',
        loadComponent: () => import('./pages/tutor-panel/complaints/complaint-detail-tutor/complaint-detail-tutor.component').then(m => m.ComplaintDetailTutorComponent),
        title: 'Complaint Details | Jungle in English'
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/tutor-panel/profile/profile.component').then(m => m.TutorProfileComponent),
        title: 'My Profile | Jungle in English'
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/tutor-panel/settings/settings.component').then(m => m.TutorSettingsComponent),
        title: 'Settings | Jungle in English'
      },
      {
        path: 'help',
        loadComponent: () => import('./pages/tutor-panel/help/help.component').then(m => m.TutorHelpComponent),
        title: 'Help & Support | Jungle in English'
      },
      {
        path: 'exam-grading',
        loadComponent: () => import('./pages/tutor-panel/exam-grading/exam-grading.component').then(m => m.ExamGradingComponent),
        title: 'Exam Grading | Jungle in English'
      },
      {
        path: 'forum',
        loadComponent: () => import('./pages/student-panel/forum/forum.component').then(m => m.ForumComponent),
        title: 'Community Forum | Jungle in English'
      },
      {
        path: 'forum/topics/:subCategoryId/:subCategoryName',
        loadComponent: () => import('./pages/student-panel/forum/topic-list/topic-list.component').then(m => m.TopicListComponent),
        title: 'Topics | Jungle in English'
      },
      {
        path: 'forum/topic/:topicId',
        loadComponent: () => import('./pages/student-panel/forum/topic-detail/topic-detail.component').then(m => m.TopicDetailComponent),
        title: 'Topic Details | Jungle in English'
      },
      {
        path: 'support',
        loadComponent: () => import('./pages/student-panel/support/support.component').then(m => m.SupportComponent),
        title: 'Help & Support | Jungle in English'
      }
    ]
  },
  
  // Pages d'authentification (hors du layout dashboard) - Accessible uniquement aux visiteurs non connectés
  {
    path: 'auth/login',
    component: LoginComponent,
    canActivate: [guestGuard],
    title: 'Login | Jungle in English',
    data: { animation: 'LoginPage' }
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard],
    title: 'Login | Jungle in English',
    data: { animation: 'LoginPage' }
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [guestGuard],
    title: 'Register | Jungle in English',
    data: { animation: 'RegisterPage' }
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    canActivate: [guestGuard],
    title: 'Forgot Password | Jungle in English'
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
    canActivate: [guestGuard],
    title: 'Reset Password | Jungle in English'
  },
  {
    path: 'activate',
    component: ActivateComponent,
    title: 'Activate Account | Jungle in English'
  },
  {
    path: 'oauth2/callback',
    component: OAuth2CallbackComponent,
    title: 'Signing in... | Jungle in English'
  },
  {
    path: 'complete-profile',
    loadComponent: () => import('./auth/complete-profile/complete-profile.component').then(m => m.CompleteProfileComponent),
    title: 'Complete Profile | Jungle in English'
  },
  {
    path: 'accept-invitation',
    loadComponent: () => import('./auth/accept-invitation/accept-invitation.component').then(m => m.AcceptInvitationComponent),
    title: 'Accept Invitation | Jungle in English'
  },
  {
    path: 'activation-pending',
    loadComponent: () => import('./auth/activation-pending/activation-pending.component').then(m => m.ActivationPendingComponent),
    title: 'Activation Pending | Jungle in English'
  },
  {
    path: 'signin',
    component: SignInComponent,
    canActivate: [guestGuard],
    title: 'Sign In | Jungle in English'
  },
  {
    path: 'signup',
    component: SignUpComponent,
    canActivate: [guestGuard],
    title: 'Sign Up | Jungle in English'
  },
  
  // Dashboard avec toutes ses routes - Protégé pour ADMIN et ACADEMIC_OFFICE_AFFAIR
  {
    path: 'dashboard',
    component: AppLayoutComponent,
    canActivate: [roleGuard(['ADMIN', 'ACADEMIC_OFFICE_AFFAIR'])],
    children: [
      {
        path: '',
        component: EcommerceComponent,
        title: 'Dashboard | Jungle in English'
      },
      {
        path: 'calendar',
        component: CalenderComponent,
        title: 'Calendar | Jungle in English Dashboard'
      },
      {
        path: 'profile',
        component: ProfileComponent,
        title: 'Profile | Jungle in English Dashboard'
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/dashboard/settings/settings.component').then(m => m.DashboardSettingsComponent),
        title: 'Settings Profile | Jungle in English Dashboard'
      },
      {
        path: 'users/students',
        loadComponent: () => import('./pages/users/students/students.component').then(m => m.StudentsComponent),
        title: 'Students | Jungle in English Dashboard'
      },
      {
        path: 'users/tutors',
        loadComponent: () => import('./pages/users/tutors/tutors.component').then(m => m.TutorsComponent),
        title: 'Tutors | Jungle in English Dashboard'
      },
      {
        path: 'users/tutors/create',
        loadComponent: () => import('./pages/users/create-tutor/create-tutor.component').then(m => m.CreateTutorComponent),
        title: 'Create Tutor | Jungle in English Dashboard'
      },
      {
        path: 'users/academic-affairs',
        loadComponent: () => import('./pages/users/academic-affairs/academic-affairs.component').then(m => m.AcademicAffairsComponent),
        title: 'Academic Affairs | Jungle in English Dashboard'
      },
      {
        path: 'users/academic-affairs/create',
        loadComponent: () => import('./pages/users/create-academic/create-academic.component').then(m => m.CreateAcademicComponent),
        title: 'Invite Academic Staff | Jungle in English Dashboard'
      },
      {
        path: 'invitations',
        loadComponent: () => import('./pages/dashboard/invitations/invitations.component').then(m => m.InvitationsComponent),
        title: 'Invitations | Jungle in English Dashboard'
      },
      {
        path: 'sessions',
        loadComponent: () => import('./pages/dashboard/admin-sessions/admin-sessions.component').then(m => m.AdminSessionsComponent),
        title: 'Session Management | Jungle in English Dashboard'
      },
      {
        path: 'statistics',
        loadComponent: () => import('./pages/dashboard/statistics/statistics.component').then(m => m.StatisticsComponent),
        title: 'Statistics | Jungle in English Dashboard'
      },
      {
        path: 'schedules',
        loadComponent: () => import('./pages/dashboard/schedules/schedules.component').then(m => m.SchedulesComponent),
        title: 'Schedules | Jungle in English Dashboard'
      },
      {
        path: 'schedules/manage',
        loadComponent: () => import('./pages/dashboard/schedules-manage/schedules-manage.component').then(m => m.SchedulesManageComponent),
        title: 'Manage Schedules | Jungle in English Dashboard'
      },
      {
        path: 'refunds',
        loadComponent: () => import('./pages/dashboard/refunds/refunds.component').then(m => m.RefundsComponent),
        title: 'Manage Refunds | Jungle in English Dashboard'
      },
      {
        path: 'payments',
        loadComponent: () => import('./pages/dashboard/payments/payments.component').then(m => m.PaymentsComponent),
        title: 'Manage Payments | Jungle in English Dashboard'
      },
      {
        path: 'subscriptions',
        loadComponent: () => import('./pages/dashboard/subscriptions/subscriptions.component').then(m => m.SubscriptionsComponent),
        title: 'Manage Subscriptions | Jungle in English Dashboard'
      },
      {
        path: 'events',
        loadComponent: () => import('./pages/dashboard/events/events.component').then(m => m.EventsComponent),
        title: 'Events | Jungle in English Dashboard'
      },
      {
        path: 'events/manage',
        loadComponent: () => import('./pages/dashboard/events-manage/events-manage.component').then(m => m.EventsManageComponent),
        title: 'Manage Events | Jungle in English Dashboard'
      },
      {
        path: 'events/requests',
        loadComponent: () => import('./pages/dashboard/events-requests/events-requests.component').then(m => m.EventsRequestsComponent),
        title: 'Event Requests | Jungle in English Dashboard'
      },
      {
        path: 'complaints',
        loadComponent: () => import('./pages/dashboard/complaints/complaints.component').then(m => m.ComplaintsComponent),
        title: 'Manage Complaints | Jungle in English Dashboard'
      },
      {
        path: 'complaints/:id',
        loadComponent: () => import('./pages/dashboard/complaints/complaint-detail/complaint-detail.component').then(m => m.ComplaintDetailComponent),
        title: 'Complaint Details | Jungle in English Dashboard'
      },
      {
        path: 'feedbacks',
        loadComponent: () => import('./pages/dashboard/feedbacks/feedbacks.component').then(m => m.FeedbacksComponent),
        title: 'Manage Feedbacks | Jungle in English Dashboard'
      },
      {
        path: 'forum',
        loadComponent: () => import('./pages/dashboard/forum-management/forum-management.component').then(m => m.ForumManagementComponent),
        title: 'Forum Management | Jungle in English Dashboard'
      },
      {
        path: 'forum-moderation',
        loadComponent: () => import('./pages/dashboard/forum-moderation/forum-moderation.component').then(m => m.ForumModerationComponent),
        title: 'Forum Moderation | Jungle in English Dashboard'
      },
      {
        path: 'forum/topics/:subCategoryId/:subCategoryName',
        loadComponent: () => import('./pages/student-panel/forum/topic-list/topic-list.component').then(m => m.TopicListComponent),
        title: 'Topics | Jungle in English Dashboard'
      },
      {
        path: 'forum/topic/:topicId',
        loadComponent: () => import('./pages/student-panel/forum/topic-detail/topic-detail.component').then(m => m.TopicDetailComponent),
        title: 'Topic Details | Jungle in English Dashboard'
      },
      {
        path: 'ebooks',
        loadComponent: () => import('./pages/student-panel/ebooks/ebooks.component').then(m => m.EbooksComponent),
        title: 'Ebooks Management | Jungle in English Dashboard'
      },
      {
        path: 'assignments',
        loadComponent: () => import('./pages/student-panel/assignments/assignments.component').then(m => m.AssignmentsComponent),
        title: 'Assignments Management | Jungle in English Dashboard'
      },
      {
        path: 'messages',
        loadComponent: () => import('./pages/student-panel/messages/messages.component').then(m => m.MessagesComponent),
        title: 'Messages | Jungle in English Dashboard'
      },
      {
        path: 'clubs',
        loadComponent: () => import('./pages/clubs/clubs-list/clubs-list.component').then(m => m.ClubsListComponent),
        title: 'Clubs | Jungle in English Dashboard'
      },
      {
        path: 'clubs/manage',
        loadComponent: () => import('./pages/clubs/clubs-manage/clubs-manage.component').then(m => m.ClubsManageComponent),
        title: 'Manage Clubs | Jungle in English Dashboard'
      },
      {
        path: 'clubs/requests',
        loadComponent: () => import('./pages/clubs/club-requests-admin/club-requests-admin.component').then(m => m.ClubRequestsAdminComponent),
        title: 'Club Requests | Jungle in English Dashboard'
      },
      {
        path: 'clubs/create',
        loadComponent: () => import('./pages/clubs/club-create/club-create.component').then(m => m.ClubCreateComponent),
        title: 'Create Club | Jungle in English Dashboard'
      },
      {
        path: 'clubs/:id',
        loadComponent: () => import('./pages/clubs/club-detail/club-detail.component').then(m => m.ClubDetailComponent),
        title: 'Club Details | Jungle in English Dashboard'
      },
      {
        path: 'clubs/:id/edit',
        loadComponent: () => import('./pages/clubs/club-edit/club-edit.component').then(m => m.ClubEditComponent),
        title: 'Edit Club | Jungle in English Dashboard'
      },
      {
        path: 'categories',
        loadComponent: () => import('./pages/academic-panel/category-management/category-management.component').then(m => m.CategoryManagementComponent),
        title: 'Category Management | Jungle in English Dashboard'
      },
      {
        path: 'packs',
        loadComponent: () => import('./pages/academic-panel/pack-management/pack-management.component').then(m => m.PackManagementComponent),
        title: 'Pack Management | Jungle in English Dashboard'
      },
      {
        path: 'packs/create',
        loadComponent: () => import('./pages/academic-panel/pack-create/pack-create.component').then(m => m.PackCreateComponent),
        title: 'Create Pack | Jungle in English Dashboard'
      },
      {
        path: 'packs/:id',
        loadComponent: () => import('./pages/pack-details/pack-details.component').then(m => m.PackDetailsComponent),
        title: 'Pack Details | Jungle in English Dashboard'
      },
      {
        path: 'packs/edit/:id',
        loadComponent: () => import('./pages/academic-panel/pack-create/pack-create.component').then(m => m.PackCreateComponent),
        title: 'Edit Pack | Jungle in English Dashboard'
      },
      // Commented out - component doesn't exist yet
      // {
      //   path: 'course-status',
      //   loadComponent: () => import('./pages/dashboard/course-status-management/course-status-management.component').then(m => m.CourseStatusManagementComponent),
      //   canActivate: [roleGuard(['ACADEMIC_OFFICE_AFFAIR'])],
      //   title: 'Course Status Management | Jungle in English Dashboard'
      // },
      {
        path: 'exams',
        loadComponent: () => import('./pages/academic-panel/exam-management/exam-management.component').then(m => m.ExamManagementComponent),
        canActivate: [roleGuard(['ACADEMIC_OFFICE_AFFAIR'])],
        title: 'Exam Management | Jungle in English Dashboard'
      },
      {
        path: 'exams/create',
        loadComponent: () => import('./pages/academic-panel/exam-builder/exam-builder.component').then(m => m.ExamBuilderComponent),
        canActivate: [roleGuard(['ACADEMIC_OFFICE_AFFAIR'])],
        title: 'Create Exam | Jungle in English Dashboard'
      },
      {
        path: 'exams/edit/:id',
        loadComponent: () => import('./pages/academic-panel/exam-builder/exam-builder.component').then(m => m.ExamBuilderComponent),
        canActivate: [roleGuard(['ACADEMIC_OFFICE_AFFAIR'])],
        title: 'Edit Exam | Jungle in English Dashboard'
      },
      {
        path: 'exam-results',
        loadComponent: () => import('./pages/academic-panel/exam-results-monitoring/exam-results-monitoring.component').then(m => m.ExamResultsMonitoringComponent),
        canActivate: [roleGuard(['ACADEMIC_OFFICE_AFFAIR'])],
        title: 'Exam Results Monitoring | Jungle in English Dashboard'
      },
      {
        path: 'form-elements',
        component: FormElementsComponent,
        title: 'Form Elements | Jungle in English Dashboard'
      },
      {
        path: 'basic-tables',
        component: BasicTablesComponent,
        title: 'Tables | Jungle in English Dashboard'
      },
      {
        path: 'blank',
        component: BlankComponent,
        title: 'Blank Page | Jungle in English Dashboard'
      },
      {
        path: 'invoice',
        component: InvoicesComponent,
        title: 'Invoice | Jungle in English Dashboard'
      },
      {
        path: 'line-chart',
        component: LineChartComponent,
        title: 'Line Chart | Jungle in English Dashboard'
      },
      {
        path: 'bar-chart',
        component: BarChartComponent,
        title: 'Bar Chart | Jungle in English Dashboard'
      },
      {
        path: 'alerts',
        component: AlertsComponent,
        title: 'Alerts | Jungle in English Dashboard'
      },
      {
        path: 'avatars',
        component: AvatarElementComponent,
        title: 'Avatars | Jungle in English Dashboard'
      },
      {
        path: 'badge',
        component: BadgesComponent,
        title: 'Badges | Jungle in English Dashboard'
      },
      {
        path: 'buttons',
        component: ButtonsComponent,
        title: 'Buttons | Jungle in English Dashboard'
      },
      {
        path: 'images',
        component: ImagesComponent,
        title: 'Images | Jungle in English Dashboard'
      },
      {
        path: 'videos',
        component: VideosComponent,
        title: 'Videos | Jungle in English Dashboard'
      }
    ]
  },
  
  // Page 404 - DOIT ÊTRE EN DERNIER
  {
    path: '**',
    component: NotFoundComponent,
    title: 'Page Not Found | Jungle in English'
  }
];
