# Course Service Documentation

## Table of Contents
1. [Entities](#entities)
2. [Backend Controllers](#backend-controllers)
3. [Backend Services](#backend-services)
4. [Frontend Services](#frontend-services)
5. [Component Usage](#component-usage)

---

## Entities

### Entity: Course

| Field | Type | Relation |
|-------|------|----------|
| id | Long | - |
| title | String | - |
| description | String | - |
| category | String | - |
| level | String | - |
| maxStudents | Integer | - |
| schedule | LocalDateTime | - |
| duration | Integer | - |
| tutorId | Long | - |
| price | BigDecimal | - |
| fileUrl | String | - |
| thumbnailUrl | String | - |
| objectives | String (TEXT) | - |
| prerequisites | String (TEXT) | - |
| isFeatured | Boolean | - |
| status | CourseStatus (ENUM) | - |
| chapters | List\<Chapter\> | OneToMany |
| createdAt | LocalDateTime | - |
| updatedAt | LocalDateTime | - |

### Entity: Chapter

| Field | Type | Relation |
|-------|------|----------|
| id | Long | - |
| title | String | - |
| description | String | - |
| objectives | List\<String\> | ElementCollection |
| orderIndex | Integer | - |
| estimatedDuration | Integer | - |
| isPublished | Boolean | - |
| course | Course | ManyToOne |
| lessons | List\<Lesson\> | OneToMany |
| createdAt | LocalDateTime | - |
| updatedAt | LocalDateTime | - |


### Entity: Lesson

| Field | Type | Relation |
|-------|------|----------|
| id | Long | - |
| title | String | - |
| description | String | - |
| content | String (TEXT) | - |
| contentUrl | String | - |
| lessonType | LessonType (ENUM) | - |
| orderIndex | Integer | - |
| duration | Integer | - |
| isPreview | Boolean | - |
| isPublished | Boolean | - |
| chapter | Chapter | ManyToOne |
| mediaItems | List\<LessonMedia\> | OneToMany |
| createdAt | LocalDateTime | - |
| updatedAt | LocalDateTime | - |

### Entity: LessonMedia

| Field | Type | Relation |
|-------|------|----------|
| id | Long | - |
| url | String | - |
| mediaType | LessonType (ENUM) | - |
| position | Integer | - |
| title | String | - |
| description | String | - |
| lesson | Lesson | ManyToOne |
| createdAt | LocalDateTime | - |
| updatedAt | LocalDateTime | - |

### Entity: CourseCategory

| Field | Type | Relation |
|-------|------|----------|
| id | Long | - |
| name | String | - |
| description | String | - |
| icon | String | - |
| color | String | - |
| active | Boolean | - |
| displayOrder | Integer | - |
| createdAt | LocalDateTime | - |
| updatedAt | LocalDateTime | - |
| createdBy | Long | - |


### Entity: CourseEnrollment

| Field | Type | Relation |
|-------|------|----------|
| id | Long | - |
| studentId | Long | - |
| course | Course | ManyToOne |
| enrolledAt | LocalDateTime | - |
| completedAt | LocalDateTime | - |
| isActive | Boolean | - |
| totalLessons | Integer | - |
| lastAccessedAt | LocalDateTime | - |

### Entity: LessonProgress

| Field | Type | Relation |
|-------|------|----------|
| id | Long | - |
| studentId | Long | - |
| lessonId | Long | - |
| courseId | Long | - |
| isCompleted | Boolean | - |
| completedAt | LocalDateTime | - |
| timeSpent | Integer | - |
| lastAccessedAt | LocalDateTime | - |
| createdAt | LocalDateTime | - |
| updatedAt | LocalDateTime | - |

### Entity: Pack

| Field | Type | Relation |
|-------|------|----------|
| id | Long | - |
| name | String | - |
| category | String | - |
| level | String | - |
| tutorId | Long | - |
| tutorName | String | - |
| tutorRating | Double | - |
| courseIds | List\<Long\> | ElementCollection |
| price | BigDecimal | - |
| estimatedDuration | Integer | - |
| maxStudents | Integer | - |
| currentEnrolledStudents | Integer | - |
| enrollmentStartDate | LocalDateTime | - |
| enrollmentEndDate | LocalDateTime | - |
| description | String | - |
| status | PackStatus (ENUM) | - |
| createdBy | Long | - |
| createdAt | LocalDateTime | - |
| updatedAt | LocalDateTime | - |


### Entity: PackEnrollment

| Field | Type | Relation |
|-------|------|----------|
| id | Long | - |
| studentId | Long | - |
| studentName | String | - |
| packId | Long | - |
| packName | String | - |
| packCategory | String | - |
| packLevel | String | - |
| tutorId | Long | - |
| tutorName | String | - |
| totalCourses | Integer | - |
| enrolledAt | LocalDateTime | - |
| completedAt | LocalDateTime | - |
| status | String | - |
| isActive | Boolean | - |

### Entity: TutorAvailability

| Field | Type | Relation |
|-------|------|----------|
| id | Long | - |
| tutorId | Long | - |
| tutorName | String | - |
| availableDays | Set\<DayOfWeek\> | ElementCollection |
| timeSlots | List\<TimeSlot\> | OneToMany |
| maxStudentsCapacity | Integer | - |
| currentStudentsCount | Integer | - |
| categories | Set\<String\> | ElementCollection |
| levels | Set\<String\> | ElementCollection |
| status | TutorStatus (ENUM) | - |
| lastUpdated | LocalDateTime | - |
| createdAt | LocalDateTime | - |

### Entity: TimeSlot

| Field | Type | Relation |
|-------|------|----------|
| id | Long | - |
| startTime | LocalTime | - |
| endTime | LocalTime | - |
| tutorAvailability | TutorAvailability | ManyToOne |

---

## Backend Controllers


### Controller: CourseController
**Base Path:** `/courses`

| Method | URL | Function | Description |
|--------|-----|----------|-------------|
| POST | /courses | createCourse() | Create a new course |
| GET | /courses/{id} | getCourseById() | Get course details by ID |
| GET | /courses | getAllCourses() | Get all courses |
| GET | /courses/published | getPublishedCourses() | Get only published courses |
| GET | /courses/status/{status} | getCoursesByStatus() | Get courses by status (DRAFT, PUBLISHED, ARCHIVED) |
| GET | /courses/level/{level} | getCoursesByLevel() | Get courses by CEFR level |
| PUT | /courses/{id} | updateCourse() | Update course details |
| DELETE | /courses/{id} | deleteCourse() | Delete a course |
| GET | /courses/tutor/{tutorId} | getCoursesByTutor() | Get all courses created by a tutor |
| GET | /courses/{id}/exists | courseExists() | Check if course exists |
| POST | /courses/{id}/upload-thumbnail | uploadThumbnail() | Upload course thumbnail image (max 5MB) |
| POST | /courses/{id}/upload-material | uploadCourseMaterial() | Upload course material file (max 50MB) |
| DELETE | /courses/{id}/thumbnail | deleteThumbnail() | Delete course thumbnail |

### Controller: ChapterController
**Base Path:** `/chapters`

| Method | URL | Function | Description |
|--------|-----|----------|-------------|
| POST | /chapters | createChapter() | Create a new chapter for a course |
| GET | /chapters/{id} | getChapterById() | Get chapter details by ID |
| GET | /chapters | getAllChapters() | Get all chapters |
| GET | /chapters/course/{courseId} | getChaptersByCourse() | Get all chapters for a specific course |
| GET | /chapters/course/{courseId}/published | getPublishedChaptersByCourse() | Get only published chapters for a course |
| PUT | /chapters/{id} | updateChapter() | Update chapter details |
| DELETE | /chapters/{id} | deleteChapter() | Delete a chapter |
| GET | /chapters/{id}/exists | chapterExists() | Check if chapter exists |
| GET | /chapters/{chapterId}/belongs-to-course/{courseId} | chapterBelongsToCourse() | Verify if chapter belongs to a specific course |


### Controller: LessonController
**Base Path:** `/lessons`

| Method | URL | Function | Description |
|--------|-----|----------|-------------|
| POST | /lessons | createLesson() | Create a new lesson in a chapter |
| GET | /lessons/{id} | getLessonById() | Get lesson details by ID |
| GET | /lessons | getAllLessons() | Get all lessons |
| GET | /lessons/chapter/{chapterId} | getLessonsByChapter() | Get all lessons in a chapter |
| GET | /lessons/chapter/{chapterId}/published | getPublishedLessonsByChapter() | Get only published lessons in a chapter |
| GET | /lessons/course/{courseId} | getLessonsByCourse() | Get all lessons in a course |
| GET | /lessons/type/{lessonType} | getLessonsByType() | Get lessons by type (VIDEO, DOCUMENT, TEXT, QUIZ) |
| GET | /lessons/course/{courseId}/preview | getPreviewLessonsByCourse() | Get preview lessons for a course |
| PUT | /lessons/{id} | updateLesson() | Update lesson details |
| DELETE | /lessons/{id} | deleteLesson() | Delete a lesson |
| GET | /lessons/{id}/exists | lessonExists() | Check if lesson exists |
| GET | /lessons/{lessonId}/belongs-to-chapter/{chapterId} | lessonBelongsToChapter() | Verify if lesson belongs to a chapter |
| GET | /lessons/{lessonId}/belongs-to-course/{courseId} | lessonBelongsToCourse() | Verify if lesson belongs to a course |
| POST | /lessons/{id}/upload-video | uploadVideo() | Upload video file for lesson (max 500MB) |
| POST | /lessons/{id}/upload-document | uploadDocument() | Upload document file for lesson (max 50MB) |
| DELETE | /lessons/{id}/content-file | deleteContentFile() | Delete lesson content file |

### Controller: LessonMediaController
**Base Path:** `/lesson-media`

| Method | URL | Function | Description |
|--------|-----|----------|-------------|
| POST | /lesson-media | createMedia() | Create a new media item for a lesson |
| PUT | /lesson-media/{id} | updateMedia() | Update media item details |
| DELETE | /lesson-media/{id} | deleteMedia() | Delete a media item |
| GET | /lesson-media/{id} | getMediaById() | Get media item by ID |
| GET | /lesson-media/lesson/{lessonId} | getMediaByLesson() | Get all media items for a lesson |
| PUT | /lesson-media/lesson/{lessonId}/reorder | reorderMedia() | Reorder media items in a lesson |


### Controller: CourseEnrollmentController
**Base Path:** `/enrollments`

| Method | URL | Function | Description |
|--------|-----|----------|-------------|
| POST | /enrollments/enroll | enrollStudent() | Enroll a student in a course |
| DELETE | /enrollments/unenroll | unenrollStudent() | Unenroll a student from a course |
| GET | /enrollments/student/{studentId} | getStudentEnrollments() | Get all enrollments for a student |
| GET | /enrollments/course/{courseId} | getCourseEnrollments() | Get all enrollments for a course |
| GET | /enrollments/check | isStudentEnrolled() | Check if student is enrolled in a course |
| PUT | /enrollments/progress | updateProgress() | Update enrollment progress (deprecated) |
| GET | /enrollments/details | getEnrollment() | Get enrollment details for student and course |
| GET | /enrollments/course/{courseId}/count | getCourseEnrollmentCount() | Get total enrollment count for a course |
| PUT | /enrollments/calculate-progress | calculateAndUpdateProgress() | Calculate and return enrollment progress |

### Controller: LessonProgressController
**Base Path:** `/lesson-progress`

| Method | URL | Function | Description |
|--------|-----|----------|-------------|
| GET | /lesson-progress/student/{studentId}/lesson/{lessonId} | getProgressByStudentAndLesson() | Get progress for a specific lesson and student |
| GET | /lesson-progress/student/{studentId}/course/{courseId} | getProgressByStudentAndCourse() | Get all lesson progress for a student in a course |
| GET | /lesson-progress/student/{studentId}/course/{courseId}/summary | getCourseProgressSummary() | Get course progress summary with statistics |
| POST | /lesson-progress | createProgress() | Create or update lesson progress |

### Controller: PackController
**Base Path:** `/packs`

| Method | URL | Function | Description |
|--------|-----|----------|-------------|
| POST | /packs | createPack() | Create a new course pack |
| PUT | /packs/{id} | updatePack() | Update pack details |
| GET | /packs/{id} | getById() | Get pack by ID |
| GET | /packs | getAllPacks() | Get all packs |
| GET | /packs/tutor/{tutorId} | getByTutorId() | Get packs by tutor |
| GET | /packs/status/{status} | getByStatus() | Get packs by status |
| GET | /packs/search | searchPacks() | Search packs by category and level |
| GET | /packs/available | getAvailablePacks() | Get available packs with optional filters |
| GET | /packs/academic/{academicId} | getByCreatedBy() | Get packs created by academic |
| DELETE | /packs/{id} | deletePack() | Delete a pack |


### Controller: PackEnrollmentController
**Base Path:** `/pack-enrollments`

| Method | URL | Function | Description |
|--------|-----|----------|-------------|
| POST | /pack-enrollments | enrollStudent() | Enroll student in a pack (auto-enrolls in all pack courses) |
| GET | /pack-enrollments/{id} | getById() | Get enrollment by ID |
| GET | /pack-enrollments/student/{studentId} | getByStudentId() | Get all enrollments for a student |
| GET | /pack-enrollments/student/{studentId}/active | getActiveEnrollmentsByStudent() | Get active enrollments for a student |
| GET | /pack-enrollments/pack/{packId} | getByPackId() | Get all enrollments for a pack |
| GET | /pack-enrollments/tutor/{tutorId} | getByTutorId() | Get enrollments for tutor's packs |
| PUT | /pack-enrollments/{id}/progress | updateProgress() | Update pack enrollment progress |
| PUT | /pack-enrollments/{id}/complete | completeEnrollment() | Mark pack enrollment as complete |
| DELETE | /pack-enrollments/{id} | cancelEnrollment() | Cancel pack enrollment |
| GET | /pack-enrollments/check | isStudentEnrolled() | Check if student is enrolled in pack |
| POST | /pack-enrollments/recalculate-progress | recalculateProgress() | Recalculate pack progress |

### Controller: CourseCategoryController
**Base Path:** `/categories`

| Method | URL | Function | Description |
|--------|-----|----------|-------------|
| POST | /categories | createCategory() | Create a new course category |
| PUT | /categories/{id} | updateCategory() | Update category details |
| GET | /categories/{id} | getById() | Get category by ID |
| GET | /categories | getAllCategories() | Get all categories |
| GET | /categories/active | getActiveCategories() | Get only active categories |
| DELETE | /categories/{id} | deleteCategory() | Delete a category |
| PUT | /categories/{id}/toggle-active | toggleActive() | Toggle category active status |
| PUT | /categories/{id}/order | updateDisplayOrder() | Update category display order |

### Controller: TutorAvailabilityController
**Base Path:** `/tutor-availability`

| Method | URL | Function | Description |
|--------|-----|----------|-------------|
| POST | /tutor-availability | createOrUpdateAvailability() | Create or update tutor availability |
| GET | /tutor-availability/{id} | getById() | Get availability by ID |
| GET | /tutor-availability/tutor/{tutorId} | getByTutorId() | Get availability by tutor ID |
| GET | /tutor-availability | getAllAvailabilities() | Get all tutor availabilities |
| GET | /tutor-availability/status/{status} | getByStatus() | Get availabilities by status |
| GET | /tutor-availability/search | getAvailableTutors() | Search available tutors by category and level |
| GET | /tutor-availability/with-capacity | getTutorsWithCapacity() | Get tutors with available capacity |
| DELETE | /tutor-availability/{id} | deleteAvailability() | Delete tutor availability |

---

## Backend Services


### Service: CourseService

| Function | Params | Returns | Description |
|----------|--------|---------|-------------|
| getAllCourses() | - | List\<CourseDTO\> | Get all courses |
| getCourseById() | id: Long | CourseDTO | Get course by ID |
| getPublishedCourses() | - | List\<CourseDTO\> | Get only published courses |
| getCoursesByLevel() | level: String | List\<CourseDTO\> | Get courses by CEFR level |
| getCoursesByStatus() | status: CourseStatus | List\<CourseDTO\> | Get courses by status |
| createCourse() | courseDTO: CourseDTO | CourseDTO | Create a new course with tutor validation |
| updateCourse() | id: Long, courseDTO: CourseDTO | CourseDTO | Update course details |
| deleteCourse() | id: Long | void | Delete a course |
| existsById() | id: Long | boolean | Check if course exists |
| getCoursesByTutor() | tutorId: Long | List\<CourseDTO\> | Get all courses by tutor |

### Service: ChapterService

| Function | Params | Returns | Description |
|----------|--------|---------|-------------|
| getAllChapters() | - | List\<ChapterDTO\> | Get all chapters |
| getChapterById() | id: Long | ChapterDTO | Get chapter by ID |
| getChaptersByCourse() | courseId: Long | List\<ChapterDTO\> | Get chapters by course ID ordered by index |
| getPublishedChaptersByCourse() | courseId: Long | List\<ChapterDTO\> | Get only published chapters for a course |
| createChapter() | chapterDTO: ChapterDTO | ChapterDTO | Create a new chapter |
| updateChapter() | id: Long, chapterDTO: ChapterDTO | ChapterDTO | Update chapter details |
| deleteChapter() | id: Long | void | Delete a chapter |
| existsById() | id: Long | boolean | Check if chapter exists |
| belongsToCourse() | chapterId: Long, courseId: Long | boolean | Check if chapter belongs to course |
| calculateChapterProgress() | studentId: Long, chapterId: Long | double | Calculate chapter progress percentage |
| getCompletedLessonsInChapter() | studentId: Long, chapterId: Long | int | Get count of completed lessons in chapter |

### Service: LessonService

| Function | Params | Returns | Description |
|----------|--------|---------|-------------|
| getAllLessons() | - | List\<LessonDTO\> | Get all lessons |
| getLessonById() | id: Long | LessonDTO | Get lesson by ID |
| getLessonsByChapter() | chapterId: Long | List\<LessonDTO\> | Get lessons by chapter ordered by index |
| getPublishedLessonsByChapter() | chapterId: Long | List\<LessonDTO\> | Get only published lessons in chapter |
| getLessonsByCourse() | courseId: Long | List\<LessonDTO\> | Get all lessons in a course |
| getLessonsByType() | type: LessonType | List\<LessonDTO\> | Get lessons by type |
| getPreviewLessonsByCourse() | courseId: Long | List\<LessonDTO\> | Get preview lessons for course |
| createLesson() | lessonDTO: LessonDTO | LessonDTO | Create a new lesson |
| updateLesson() | id: Long, lessonDTO: LessonDTO | LessonDTO | Update lesson details |
| deleteLesson() | id: Long | void | Delete a lesson |
| existsById() | id: Long | boolean | Check if lesson exists |
| belongsToChapter() | lessonId: Long, chapterId: Long | boolean | Check if lesson belongs to chapter |
| belongsToCourse() | lessonId: Long, courseId: Long | boolean | Check if lesson belongs to course |


### Service: LessonMediaService

| Function | Params | Returns | Description |
|----------|--------|---------|-------------|
| createMedia() | mediaDTO: LessonMediaDTO | LessonMediaDTO | Create a new media item for lesson |
| updateMedia() | id: Long, mediaDTO: LessonMediaDTO | LessonMediaDTO | Update media item |
| deleteMedia() | id: Long | void | Delete media item |
| getMediaById() | id: Long | LessonMediaDTO | Get media by ID |
| getMediaByLesson() | lessonId: Long | List\<LessonMediaDTO\> | Get all media for a lesson ordered by position |
| reorderMedia() | lessonId: Long, mediaIds: List\<Long\> | List\<LessonMediaDTO\> | Reorder media items in lesson |

### Service: LessonProgressService

| Function | Params | Returns | Description |
|----------|--------|---------|-------------|
| getProgressByStudentAndLesson() | studentId: Long, lessonId: Long | LessonProgress | Get progress for specific lesson and student |
| getProgressByStudentAndCourse() | studentId: Long, courseId: Long | List\<LessonProgress\> | Get all lesson progress for student in course |
| getCourseProgressSummary() | studentId: Long, courseId: Long | CourseProgressSummary | Get course progress summary with statistics |
| createOrUpdateProgress() | request: CreateLessonProgressRequest | LessonProgress | Create or update lesson progress and trigger completion checks |
| countCompletedLessonsInCourse() | studentId: Long, courseId: Long | Long | Count completed lessons in course |

### Service: CourseEnrollmentService

| Function | Params | Returns | Description |
|----------|--------|---------|-------------|
| enrollStudent() | studentId: Long, courseId: Long | CourseEnrollmentDTO | Enroll student in course with validation |
| unenrollStudent() | studentId: Long, courseId: Long | void | Unenroll student from course |
| getStudentEnrollments() | studentId: Long | List\<CourseEnrollmentDTO\> | Get all active enrollments for student |
| getCourseEnrollments() | courseId: Long | List\<CourseEnrollmentDTO\> | Get all enrollments for a course |
| isStudentEnrolled() | studentId: Long, courseId: Long | boolean | Check if student is enrolled in course |
| updateProgress() | studentId: Long, courseId: Long, progress: Double, completedLessons: Integer | CourseEnrollmentDTO | Update enrollment progress (deprecated) |
| getEnrollment() | studentId: Long, courseId: Long | CourseEnrollmentDTO | Get enrollment details |
| getCourseEnrollmentCount() | courseId: Long | Long | Get total enrollment count for course |
| calculateCourseProgress() | studentId: Long, courseId: Long | double | Calculate course progress percentage dynamically |
| getCompletedLessonsCount() | studentId: Long, courseId: Long | int | Get count of completed lessons in course |
| checkAndMarkCourseCompletion() | studentId: Long, courseId: Long, enrollment: CourseEnrollment | void | Check if course is completed and mark it |
| isCourseCompleted() | studentId: Long, courseId: Long | boolean | Check if course is completed |


### Service: PackService

| Function | Params | Returns | Description |
|----------|--------|---------|-------------|
| createPack() | packDTO: PackDTO | PackDTO | Create a new course pack |
| updatePack() | id: Long, packDTO: PackDTO | PackDTO | Update pack details |
| getById() | id: Long | PackDTO | Get pack by ID |
| getAllPacks() | - | List\<PackDTO\> | Get all packs |
| getByTutorId() | tutorId: Long | List\<PackDTO\> | Get packs by tutor |
| getByStatus() | status: PackStatus | List\<PackDTO\> | Get packs by status |
| getByCategoryAndLevel() | category: String, level: String | List\<PackDTO\> | Get packs by category and level |
| getAvailablePacksByCategoryAndLevel() | category: String, level: String | List\<PackDTO\> | Get available packs by category and level |
| getAllAvailablePacks() | - | List\<PackDTO\> | Get all available packs |
| getByCreatedBy() | academicId: Long | List\<PackDTO\> | Get packs created by academic |
| deletePack() | id: Long | void | Delete pack and all enrollments |
| incrementEnrollment() | packId: Long | void | Increment pack enrollment count |
| decrementEnrollment() | packId: Long | void | Decrement pack enrollment count |

### Service: PackEnrollmentService

| Function | Params | Returns | Description |
|----------|--------|---------|-------------|
| enrollStudent() | studentId: Long, packId: Long | PackEnrollmentDTO | Enroll student in pack and auto-enroll in all pack courses |
| getById() | id: Long | PackEnrollmentDTO | Get enrollment by ID with dynamic progress |
| getByStudentId() | studentId: Long | List\<PackEnrollmentDTO\> | Get all enrollments for student |
| getByPackId() | packId: Long | List\<PackEnrollmentDTO\> | Get all enrollments for pack |
| getByTutorId() | tutorId: Long | List\<PackEnrollmentDTO\> | Get enrollments for tutor's packs |
| getActiveEnrollmentsByStudent() | studentId: Long | List\<PackEnrollmentDTO\> | Get active enrollments for student |
| updateProgress() | enrollmentId: Long, progressPercentage: Integer | PackEnrollmentDTO | Update progress (deprecated) |
| completeEnrollment() | enrollmentId: Long | void | Mark enrollment as complete |
| cancelEnrollment() | enrollmentId: Long | void | Cancel enrollment |
| isStudentEnrolled() | studentId: Long, packId: Long | boolean | Check if student is enrolled in pack |
| calculatePackProgress() | studentId: Long, packId: Long | double | Calculate pack progress using weighted lesson-based formula |
| getCompletedCoursesCount() | studentId: Long, packId: Long | int | Get count of completed courses in pack |
| checkAndMarkPackCompletion() | studentId: Long, packId: Long | void | Check if pack is completed and mark it |


### Service: CourseCategoryService

| Function | Params | Returns | Description |
|----------|--------|---------|-------------|
| createCategory() | categoryDTO: CourseCategoryDTO | CourseCategoryDTO | Create a new course category |
| updateCategory() | id: Long, categoryDTO: CourseCategoryDTO | CourseCategoryDTO | Update category details |
| getById() | id: Long | CourseCategoryDTO | Get category by ID |
| getAllCategories() | - | List\<CourseCategoryDTO\> | Get all categories ordered by display order |
| getActiveCategories() | - | List\<CourseCategoryDTO\> | Get only active categories |
| deleteCategory() | id: Long | void | Delete a category |
| toggleActive() | id: Long | void | Toggle category active status |
| updateDisplayOrder() | id: Long, newOrder: Integer | void | Update category display order |

### Service: TutorAvailabilityService

| Function | Params | Returns | Description |
|----------|--------|---------|-------------|
| createOrUpdateAvailability() | availabilityDTO: TutorAvailabilityDTO | TutorAvailabilityDTO | Create or update tutor availability |
| getByTutorId() | tutorId: Long | TutorAvailabilityDTO | Get availability by tutor ID |
| getById() | id: Long | TutorAvailabilityDTO | Get availability by ID |
| getAllAvailabilities() | - | List\<TutorAvailabilityDTO\> | Get all tutor availabilities |
| getByStatus() | status: TutorStatus | List\<TutorAvailabilityDTO\> | Get availabilities by status |
| getAvailableTutorsByCategoryAndLevel() | category: String, level: String | List\<TutorAvailabilityDTO\> | Get available tutors by category and level |
| getTutorsWithCapacity() | - | List\<TutorAvailabilityDTO\> | Get tutors with available capacity |
| incrementStudentCount() | tutorId: Long | void | Increment tutor's student count |
| decrementStudentCount() | tutorId: Long | void | Decrement tutor's student count |
| deleteAvailability() | id: Long | void | Delete tutor availability |

---

## Frontend Services


### Angular Service: CourseService
**Base URL:** `${environment.apiUrl}/courses`

| Function | Params | Returns | Calls Endpoint | Used In Components |
|----------|--------|---------|----------------|-------------------|
| createCourse() | course: CreateCourseRequest | Observable\<Course\> | POST /courses | course-create.component.ts |
| getCourseById() | id: number | Observable\<Course\> | GET /courses/{id} | course-view.component.ts, course-edit.component.ts, course-learning.component.ts, my-courses.component.ts, pack-courses.component.ts, student-pack-details.component.ts, pack-details.component.ts |
| getAllCourses() | - | Observable\<Course[]\> | GET /courses | course-catalog.component.ts, course-status-management.component.ts |
| getCoursesByStatus() | status: CourseStatus | Observable\<Course[]\> | GET /courses/status/{status} | course-catalog.component.ts |
| getCoursesByLevel() | level: string | Observable\<Course[]\> | GET /courses/level/{level} | course-catalog.component.ts |
| getCoursesByTutor() | tutorId: number | Observable\<Course[]\> | GET /courses/tutor/{tutorId} | course-list.component.ts |
| updateCourse() | id: number, course: UpdateCourseRequest | Observable\<Course\> | PUT /courses/{id} | course-edit.component.ts, course-status-management.component.ts |
| deleteCourse() | id: number | Observable\<void\> | DELETE /courses/{id} | course-list.component.ts |
| getPublishedCourses() | - | Observable\<Course[]\> | GET /courses/status/PUBLISHED | course-catalog.component.ts |
| uploadThumbnail() | courseId: number, file: File | Observable\<any\> | POST /courses/{courseId}/upload-thumbnail | course-create.component.ts, course-edit.component.ts |
| uploadCourseMaterial() | courseId: number, file: File | Observable\<any\> | POST /courses/{courseId}/upload-material | course-create.component.ts, course-edit.component.ts |
| deleteThumbnail() | courseId: number | Observable\<any\> | DELETE /courses/{courseId}/thumbnail | course-edit.component.ts |

### Angular Service: ChapterService
**Base URL:** `${environment.apiUrl}/chapters`

| Function | Params | Returns | Calls Endpoint | Used In Components |
|----------|--------|---------|----------------|-------------------|
| createChapter() | chapter: CreateChapterRequest | Observable\<Chapter\> | POST /chapters | chapter-management.component.ts |
| getChapterById() | id: number | Observable\<Chapter\> | GET /chapters/{id} | lesson-viewer.component.ts, lesson-view.component.ts |
| getAllChapters() | - | Observable\<Chapter[]\> | GET /chapters | - |
| getChaptersByCourse() | courseId: number | Observable\<Chapter[]\> | GET /chapters/course/{courseId} | chapter-management.component.ts, course-view.component.ts (tutor), course-status-management.component.ts |
| getPublishedChaptersByCourse() | courseId: number | Observable\<Chapter[]\> | GET /chapters/course/{courseId}/published | course-view.component.ts (student), course-learning.component.ts |
| updateChapter() | id: number, chapter: UpdateChapterRequest | Observable\<Chapter\> | PUT /chapters/{id} | chapter-management.component.ts |
| deleteChapter() | id: number | Observable\<void\> | DELETE /chapters/{id} | chapter-management.component.ts |
| chapterExists() | id: number | Observable\<boolean\> | GET /chapters/{id}/exists | - |
| chapterBelongsToCourse() | chapterId: number, courseId: number | Observable\<boolean\> | GET /chapters/{chapterId}/belongs-to-course/{courseId} | - |


### Angular Service: LessonService
**Base URL:** `${environment.apiUrl}/lessons`

| Function | Params | Returns | Calls Endpoint | Used In Components |
|----------|--------|---------|----------------|-------------------|
| createLesson() | lesson: CreateLessonRequest | Observable\<Lesson\> | POST /lessons | lesson-management.component.ts |
| getLessonById() | id: number | Observable\<Lesson\> | GET /lessons/{id} | lesson-viewer.component.ts, lesson-view.component.ts |
| getAllLessons() | - | Observable\<Lesson[]\> | GET /lessons | - |
| getLessonsByChapter() | chapterId: number | Observable\<Lesson[]\> | GET /lessons/chapter/{chapterId} | lesson-management.component.ts, course-view.component.ts (tutor), course-status-management.component.ts |
| getPublishedLessonsByChapter() | chapterId: number | Observable\<Lesson[]\> | GET /lessons/chapter/{chapterId}/published | course-view.component.ts (student), course-learning.component.ts |
| getLessonsByCourse() | courseId: number | Observable\<Lesson[]\> | GET /lessons/course/{courseId} | - |
| getLessonsByType() | lessonType: LessonType | Observable\<Lesson[]\> | GET /lessons/type/{lessonType} | - |
| getPreviewLessonsByCourse() | courseId: number | Observable\<Lesson[]\> | GET /lessons/course/{courseId}/preview | - |
| updateLesson() | id: number, lesson: UpdateLessonRequest | Observable\<Lesson\> | PUT /lessons/{id} | lesson-management.component.ts |
| deleteLesson() | id: number | Observable\<void\> | DELETE /lessons/{id} | lesson-management.component.ts |
| lessonExists() | id: number | Observable\<boolean\> | GET /lessons/{id}/exists | - |
| lessonBelongsToChapter() | lessonId: number, chapterId: number | Observable\<boolean\> | GET /lessons/{lessonId}/belongs-to-chapter/{chapterId} | - |
| lessonBelongsToCourse() | lessonId: number, courseId: number | Observable\<boolean\> | GET /lessons/{lessonId}/belongs-to-course/{courseId} | - |
| uploadVideo() | lessonId: number, file: File | Observable\<{url: string, message: string}\> | POST /lessons/{lessonId}/upload-video | lesson-management.component.ts |
| uploadDocument() | lessonId: number, file: File | Observable\<{url: string, message: string}\> | POST /lessons/{lessonId}/upload-document | lesson-management.component.ts |
| deleteContentFile() | lessonId: number | Observable\<{message: string}\> | DELETE /lessons/{lessonId}/content-file | lesson-management.component.ts |

### Angular Service: LessonMediaService
**Base URL:** `${environment.apiUrl}/lesson-media`

| Function | Params | Returns | Calls Endpoint | Used In Components |
|----------|--------|---------|----------------|-------------------|
| createMedia() | media: LessonMedia | Observable\<LessonMedia\> | POST /lesson-media | lesson-management.component.ts |
| updateMedia() | id: number, media: LessonMedia | Observable\<LessonMedia\> | PUT /lesson-media/{id} | lesson-view.component.ts |
| deleteMedia() | id: number | Observable\<void\> | DELETE /lesson-media/{id} | lesson-management.component.ts |
| getMediaById() | id: number | Observable\<LessonMedia\> | GET /lesson-media/{id} | - |
| getMediaByLesson() | lessonId: number | Observable\<LessonMedia[]\> | GET /lesson-media/lesson/{lessonId} | lesson-view.component.ts, lesson-viewer.component.ts |
| reorderMedia() | lessonId: number, mediaIds: number[] | Observable\<LessonMedia[]\> | PUT /lesson-media/lesson/{lessonId}/reorder | lesson-management.component.ts |


### Angular Service: LessonProgressService
**Base URL:** `${environment.apiUrl}/lesson-progress`

| Function | Params | Returns | Calls Endpoint | Used In Components |
|----------|--------|---------|----------------|-------------------|
| getProgressByStudentAndLesson() | studentId: number, lessonId: number | Observable\<LessonProgress\> | GET /lesson-progress/student/{studentId}/lesson/{lessonId} | lesson-viewer.component.ts |
| getProgressByStudentAndCourse() | studentId: number, courseId: number | Observable\<LessonProgress[]\> | GET /lesson-progress/student/{studentId}/course/{courseId} | course-learning.component.ts, pack-courses.component.ts |
| getCourseProgressSummary() | studentId: number, courseId: number | Observable\<CourseProgressSummary\> | GET /lesson-progress/student/{studentId}/course/{courseId}/summary | my-courses.component.ts, my-packs.component.ts |
| markLessonComplete() | studentId: number, lessonId: number, courseId: number, timeSpent?: number | Observable\<LessonProgress\> | POST /lesson-progress | course-learning.component.ts, lesson-viewer.component.ts |
| updateProgress() | progressId: number, request: UpdateLessonProgressRequest | Observable\<LessonProgress\> | PUT /lesson-progress/{progressId} | - |
| isLessonCompleted() | courseId: number, lessonId: number | boolean | (Local cache) | course-learning.component.ts |
| clearCache() | - | void | (Local) | course-learning.component.ts |
| getCompletedLessonIds() | courseId: number | number[] | (Local cache) | course-learning.component.ts |

**Special Features:**
- Maintains local cache of completed lessons per course
- Emits progress updates via `progressUpdate$` observable
- Auto-updates cache when marking lessons complete

### Angular Service: PackService
**Base URL:** `${environment.apiUrl}/packs`

| Function | Params | Returns | Calls Endpoint | Used In Components |
|----------|--------|---------|----------------|-------------------|
| createPack() | pack: Pack | Observable\<Pack\> | POST /packs | pack-create.component.ts |
| updatePack() | id: number, pack: Pack | Observable\<Pack\> | PUT /packs/{id} | pack-create.component.ts |
| getById() | id: number | Observable\<Pack\> | GET /packs/{id} | student-pack-details.component.ts, my-packs.component.ts, pack-courses.component.ts, pack-details.component.ts |
| getAllPacks() | - | Observable\<Pack[]\> | GET /packs | pack-management.component.ts |
| getByTutorId() | tutorId: number | Observable\<Pack[]\> | GET /packs/tutor/{tutorId} | my-students.component.ts |
| getByStatus() | status: PackStatus | Observable\<Pack[]\> | GET /packs/status/{status} | home.component.ts |
| searchPacks() | category: string, level: string | Observable\<Pack[]\> | GET /packs/search?category={category}&level={level} | pack-catalog.component.ts |
| getAvailablePacks() | category?: string, level?: string | Observable\<Pack[]\> | GET /packs/available?category={category}&level={level} | pack-catalog.component.ts |
| getByCreatedBy() | academicId: number | Observable\<Pack[]\> | GET /packs/academic/{academicId} | pack-management.component.ts |
| deletePack() | id: number | Observable\<void\> | DELETE /packs/{id} | pack-management.component.ts |


### Angular Service: PackEnrollmentService
**Base URL:** `${environment.apiUrl}/pack-enrollments`

| Function | Params | Returns | Calls Endpoint | Used In Components |
|----------|--------|---------|----------------|-------------------|
| enrollStudent() | studentId: number, packId: number | Observable\<PackEnrollment\> | POST /pack-enrollments?studentId={studentId}&packId={packId} | pack-catalog.component.ts, student-pack-details.component.ts, pack-details.component.ts |
| getById() | id: number | Observable\<PackEnrollment\> | GET /pack-enrollments/{id} | - |
| getByStudentId() | studentId: number | Observable\<PackEnrollment[]\> | GET /pack-enrollments/student/{studentId} | pack-courses.component.ts |
| getActiveEnrollmentsByStudent() | studentId: number | Observable\<PackEnrollment[]\> | GET /pack-enrollments/student/{studentId}/active | my-packs.component.ts, my-courses.component.ts |
| getByPackId() | packId: number | Observable\<PackEnrollment[]\> | GET /pack-enrollments/pack/{packId} | pack-details.component.ts |
| getByTutorId() | tutorId: number | Observable\<PackEnrollment[]\> | GET /pack-enrollments/tutor/{tutorId} | my-students.component.ts |
| updateProgress() | enrollmentId: number, progressPercentage: number | Observable\<PackEnrollment\> | PUT /pack-enrollments/{enrollmentId}/progress?progressPercentage={progressPercentage} | - |
| completeEnrollment() | enrollmentId: number | Observable\<void\> | PUT /pack-enrollments/{enrollmentId}/complete | - |
| cancelEnrollment() | enrollmentId: number | Observable\<void\> | DELETE /pack-enrollments/{enrollmentId} | - |
| isStudentEnrolled() | studentId: number, packId: number | Observable\<boolean\> | GET /pack-enrollments/check?studentId={studentId}&packId={packId} | pack-catalog.component.ts, student-pack-details.component.ts |

### Angular Service: CourseCategoryService
**Base URL:** `${environment.apiUrl}/categories`

| Function | Params | Returns | Calls Endpoint | Used In Components |
|----------|--------|---------|----------------|-------------------|
| createCategory() | category: CourseCategory | Observable\<CourseCategory\> | POST /categories | category-management.component.ts |
| updateCategory() | id: number, category: CourseCategory | Observable\<CourseCategory\> | PUT /categories/{id} | category-management.component.ts |
| getById() | id: number | Observable\<CourseCategory\> | GET /categories/{id} | - |
| getAllCategories() | - | Observable\<CourseCategory[]\> | GET /categories | course-catalog.component.ts, pack-catalog.component.ts, category-management.component.ts |
| getActiveCategories() | - | Observable\<CourseCategory[]\> | GET /categories/active | course-catalog.component.ts, pack-catalog.component.ts |
| deleteCategory() | id: number | Observable\<void\> | DELETE /categories/{id} | category-management.component.ts |
| toggleActive() | id: number | Observable\<void\> | PUT /categories/{id}/toggle-active | category-management.component.ts |
| updateDisplayOrder() | id: number, order: number | Observable\<void\> | PUT /categories/{id}/order?order={order} | category-management.component.ts |


### Angular Service: TutorAvailabilityService
**Base URL:** `${environment.apiUrl}/tutor-availability`

| Function | Params | Returns | Calls Endpoint | Used In Components |
|----------|--------|---------|----------------|-------------------|
| createOrUpdateAvailability() | availability: TutorAvailability | Observable\<TutorAvailability\> | POST /tutor-availability | tutor-availability.component.ts |
| getById() | id: number | Observable\<TutorAvailability\> | GET /tutor-availability/{id} | - |
| getByTutorId() | tutorId: number | Observable\<TutorAvailability\> | GET /tutor-availability/tutor/{tutorId} | tutor-availability.component.ts |
| getAllAvailabilities() | - | Observable\<TutorAvailability[]\> | GET /tutor-availability | tutor-list.component.ts |
| getByStatus() | status: TutorStatus | Observable\<TutorAvailability[]\> | GET /tutor-availability/status/{status} | tutor-list.component.ts |
| getAvailableTutors() | category: string, level: string | Observable\<TutorAvailability[]\> | GET /tutor-availability/search?category={category}&level={level} | tutor-search.component.ts |
| getTutorsWithCapacity() | - | Observable\<TutorAvailability[]\> | GET /tutor-availability/with-capacity | tutor-list.component.ts |
| deleteAvailability() | id: number | Observable\<void\> | DELETE /tutor-availability/{id} | tutor-availability.component.ts |

---

## Component Usage

### Student Panel Components (9 components)

**course-catalog.component.ts/html**
- Uses: CourseService, CourseCategoryService
- Purpose: Browse and filter available courses
- Key Methods: `getAllCourses()`, `getCoursesByStatus(PUBLISHED)`, `getActiveCategories()`

**course-view.component.ts/html**
- Uses: CourseService, ChapterService, LessonService
- Purpose: View course details with chapters and lessons
- Key Methods: `getCourseById()`, `getPublishedChaptersByCourse()`, `getPublishedLessonsByChapter()`

**course-learning.component.ts/html**
- Uses: CourseService, ChapterService, LessonService, LessonProgressService
- Purpose: Interactive learning interface with progress tracking
- Key Methods: `getCourseById()`, `getPublishedChaptersByCourse()`, `getProgressByStudentAndCourse()`, `markLessonComplete()`

**lesson-view.component.ts/html**
- Uses: LessonService, ChapterService, LessonMediaService
- Purpose: Display lesson content (video, text, document)
- Key Methods: `getLessonById()`, `getChapterById()`, `getMediaByLesson()`, `updateMedia()`

**lesson-viewer.component.ts/html**
- Uses: LessonService, ChapterService, LessonMediaService, LessonProgressService
- Purpose: View and complete lessons
- Key Methods: `getLessonById()`, `getMediaByLesson()`, `markLessonComplete()`


**my-courses.component.ts/html**
- Uses: CourseService, LessonProgressService, PackEnrollmentService
- Purpose: Display student's enrolled courses with progress
- Key Methods: `getCourseById()`, `getCourseProgressSummary()`, `getActiveEnrollmentsByStudent()`

**pack-catalog.component.ts/html**
- Uses: PackService, PackEnrollmentService, CourseCategoryService
- Purpose: Browse and enroll in course packs
- Key Methods: `getAvailablePacks()`, `searchPacks()`, `enrollStudent()`, `isStudentEnrolled()`

**student-pack-details.component.ts/html**
- Uses: PackService, PackEnrollmentService, CourseService
- Purpose: View pack details and enroll
- Key Methods: `getById()`, `getCourseById()`, `enrollStudent()`, `isStudentEnrolled()`

**pack-courses.component.ts/html**
- Uses: PackService, CourseService, PackEnrollmentService, LessonProgressService
- Purpose: View courses within an enrolled pack
- Key Methods: `getById()`, `getCourseById()`, `getByStudentId()`, `getProgressByStudentAndCourse()`

**my-packs.component.ts/html**
- Uses: PackService, LessonProgressService, PackEnrollmentService
- Purpose: Display student's enrolled packs with progress
- Key Methods: `getById()`, `getCourseProgressSummary()`, `getActiveEnrollmentsByStudent()`

### Tutor Panel Components (6 components)

**course-list.component.ts/html**
- Uses: CourseService
- Purpose: List tutor's courses with management options
- Key Methods: `getCoursesByTutor()`, `deleteCourse()`

**course-create.component.ts/html**
- Uses: CourseService
- Purpose: Create new course with thumbnail upload
- Key Methods: `createCourse()`, `uploadThumbnail()`

**course-edit.component.ts/html**
- Uses: CourseService
- Purpose: Edit course details and thumbnail
- Key Methods: `getCourseById()`, `updateCourse()`, `uploadThumbnail()`, `deleteThumbnail()`

**course-view.component.ts/html** (Tutor version)
- Uses: CourseService, ChapterService, LessonService
- Purpose: View course structure for management
- Key Methods: `getCourseById()`, `getChaptersByCourse()`, `getLessonsByChapter()`

**chapter-management.component.ts/html**
- Uses: ChapterService, CourseService
- Purpose: Create, edit, delete chapters
- Key Methods: `getChaptersByCourse()`, `createChapter()`, `updateChapter()`, `deleteChapter()`


**lesson-management.component.ts/html**
- Uses: LessonService, LessonMediaService, ChapterService, CourseService
- Purpose: Create, edit, delete lessons with media upload
- Key Methods: `getLessonsByChapter()`, `createLesson()`, `updateLesson()`, `deleteLesson()`, `uploadVideo()`, `uploadDocument()`, `createMedia()`, `deleteMedia()`, `reorderMedia()`

**my-students.component.ts/html**
- Uses: PackService, PackEnrollmentService
- Purpose: View students enrolled in tutor's packs
- Key Methods: `getByTutorId()` (both services)

### Academic Panel Components (3 components)

**pack-management.component.ts/html**
- Uses: PackService
- Purpose: Manage all course packs
- Key Methods: `getAllPacks()`, `deletePack()`

**pack-create.component.ts/html**
- Uses: PackService
- Purpose: Create and edit course packs
- Key Methods: `createPack()`, `updatePack()`

**pack-details.component.ts/html**
- Uses: PackService, PackEnrollmentService, CourseService
- Purpose: View pack details and enrollments
- Key Methods: `getById()`, `getCourseById()`, `getByPackId()`, `enrollStudent()`

### Dashboard Components (1 component)

**course-status-management.component.ts/html**
- Uses: CourseService, ChapterService, LessonService
- Purpose: Administrative course status management
- Key Methods: `getAllCourses()`, `updateCourse()`, `getChaptersByCourse()`, `getLessonsByChapter()`

### Public Components (1 component)

**home.component.ts/html**
- Uses: PackService
- Purpose: Display featured packs on homepage
- Key Methods: `getByStatus(ACTIVE)`

---

## Key Patterns and Architecture

### 1. Progress Tracking System
- **LessonProgress** is the source of truth (stored in database)
- **Course Progress** is calculated dynamically: `completedLessons / totalLessons * 100`
- **Pack Progress** uses weighted formula based on lesson completion across all courses
- Frontend caches completed lesson IDs for performance


### 2. Enrollment Flow
**Pack Enrollment:**
1. Student enrolls in pack via `PackEnrollmentService.enrollStudent()`
2. Backend automatically enrolls student in ALL courses in the pack
3. Progress tracking begins for all courses
4. Pack progress calculated from course progress

**Course Enrollment:**
1. Student enrolls in course via `CourseEnrollmentService.enrollStudent()`
2. Enrollment record created with `totalLessons` snapshot
3. Progress tracked via `LessonProgress` entities
4. Course marked complete when all lessons completed

### 3. File Upload System
**Course Files:**
- Thumbnail: Max 5MB (images only)
- Materials: Max 50MB (PDF, DOC, PPT, XLS)

**Lesson Files:**
- Videos: Max 500MB (MP4, AVI, MOV, MKV) with range request support
- Documents: Max 50MB (PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX)

**Storage:**
- Files stored via `FileStorageService`
- URLs returned and saved in entity `contentUrl` or `thumbnailUrl` fields
- File streaming supports progressive video loading

### 4. Content Publishing Workflow
**Status Flow:** DRAFT → PUBLISHED → ARCHIVED

**Visibility Rules:**
- Students: Only see PUBLISHED content
- Tutors: See all statuses for own content
- Academics: See all statuses for packs
- Admins: Full access to all content

**Publishing Cascade:**
- Course must be PUBLISHED for students to see it
- Chapters must have `isPublished = true`
- Lessons must have `isPublished = true`
- All three levels must be published for student visibility

### 5. Data Relationships
```
Pack
  └─> Courses (multiple via courseIds list)
       └─> Chapters (OneToMany)
            └─> Lessons (OneToMany)
                 └─> LessonMedia (OneToMany)
                 └─> LessonProgress (per student)

CourseEnrollment (tracks student-course relationship)
PackEnrollment (tracks student-pack relationship)
```


### 6. Access Control Patterns
**Student Access:**
- View only PUBLISHED courses, chapters, and lessons
- Enroll in courses and packs
- Track own progress
- View own enrollments

**Tutor Access:**
- Create and manage own courses
- View all statuses for own content
- Upload course materials and lesson content
- View students enrolled in their courses/packs

**Academic Access:**
- Create and manage course packs
- Assign tutors to packs
- View all pack enrollments
- Manage course categories

**Admin Access:**
- Full system access
- Manage course statuses
- View all content regardless of status
- System-wide reporting

### 7. Dynamic Progress Calculation
**Lesson Level:**
```
LessonProgress.isCompleted = true/false
```

**Course Level:**
```
courseProgress = (completedLessons / totalPublishedLessons) * 100
```

**Pack Level (Weighted):**
```
For each course in pack:
  courseWeight = courseLessons / totalPackLessons
  courseContribution = courseProgress * courseWeight
  
packProgress = sum(all courseContributions)
```

### 8. API Response Patterns
**Success Response:**
```json
{
  "id": 1,
  "title": "Course Title",
  "status": "PUBLISHED",
  ...
}
```

**Error Response:**
```json
{
  "timestamp": "2026-03-03T10:00:00",
  "status": 404,
  "error": "Not Found",
  "message": "Course not found with id: 123",
  "path": "/api/courses/123"
}
```

---

## Statistics

### Backend
- **Total Entities:** 11
- **Total Controllers:** 13
- **Total Endpoints:** 100+
- **Total Service Methods:** 120+

### Frontend
- **Total Angular Services:** 9
- **Total Service Methods:** 80+
- **Total Components Using Services:** 25+

### Most Used Services
1. **CourseService** - 17 components
2. **ChapterService** - 8 components
3. **PackEnrollmentService** - 8 components
4. **LessonService** - 7 components
5. **LessonProgressService** - 5 components

---

## Generated: March 3, 2026
