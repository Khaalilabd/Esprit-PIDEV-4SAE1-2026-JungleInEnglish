# EnglishFlow Exam Service

## Overview
CEFR English Exam Microservice for EnglishFlow LMS - Levels A1 to C2

## Tech Stack
- Java 17
- Spring Boot 3.2.0
- PostgreSQL
- Spring Cloud (Eureka, Feign)
- Hypersistence Utils (JSONB support)

## Database
Database: `englishflow_exams`
Port: 8087

## Key Features
1. **Exam Management** (ACADEMIC_OFFICE_AFFAIR only)
   - Create/Update/Delete exams
   - Manage parts and questions
   - Publish/Unpublish exams

2. **Student Exam Taking**
   - Random exam selection per level
   - Auto-save answers
   - Timer with auto-submit
   - Multiple question types support

3. **Auto-Grading**
   - Instant grading for objective questions
   - Manual grading queue for essays
   - Hybrid grading mode

4. **Results & Analytics**
   - CEFR band recommendation
   - Part-by-part breakdown
   - Question review with explanations

## Question Types Supported
1. MULTIPLE_CHOICE
2. TRUE_FALSE
3. FILL_IN_GAP
4. DROPDOWN_SELECT
5. WORD_ORDERING
6. MATCHING
7. OPEN_WRITING (manual grading)
8. AUDIO_RESPONSE

## API Endpoints

### Exam Management (ACADEMIC_OFFICE_AFFAIR)
- POST   /api/exams
- GET    /api/exams
- GET    /api/exams/{id}
- PUT    /api/exams/{id}
- DELETE /api/exams/{id}
- PUT    /api/exams/{id}/publish
- PUT    /api/exams/{id}/unpublish

### Parts & Questions
- POST   /api/exam-parts/exam/{examId}
- PUT    /api/exam-parts/{partId}
- DELETE /api/exam-parts/{partId}
- POST   /api/questions/part/{partId}
- PUT    /api/questions/{questionId}
- DELETE /api/questions/{questionId}

### Student Exam Taking
- GET    /api/exams/published (with optional level filter)
- POST   /api/exam-attempts/start
- GET    /api/exam-attempts/{attemptId}
- POST   /api/exam-attempts/{attemptId}/answers
- POST   /api/exam-attempts/{attemptId}/submit

### Results
- GET    /api/exam-results/attempt/{attemptId}
- GET    /api/exam-results/attempt/{attemptId}/review
- GET    /api/exam-results/student/{userId}

### Grading (ACADEMIC_OFFICE_AFFAIR)
- GET    /api/grading/queue
- POST   /api/grading/answers/{answerId}
- POST   /api/grading/attempts/{attemptId}/finalize

## Setup Instructions

### 1. Create Database
```sql
CREATE DATABASE englishflow_exams;
```

### 2. Configure Application
Update `application.yml` with your database credentials

### 3. Run Service
```bash
cd backend/exam-service
mvn clean install
mvn spring-boot:run
```

### 4. Verify
- Service: http://localhost:8087
- Eureka: http://localhost:8761
- Health: http://localhost:8087/actuator/health

## Integration with Other Services
- **Auth Service**: Feign client for user validation
- **API Gateway**: Routes requests through gateway
- **Eureka**: Service discovery

## Security
- JWT-based authentication
- Role-based access control
- ACADEMIC_OFFICE_AFFAIR: Full CRUD on exams
- STUDENT: Take exams, view results

## Random Exam Selection
When a student starts an exam for a level (e.g., A2):
1. System fetches all published A2 exams
2. Randomly selects one exam
3. Creates attempt with that exam
4. Student doesn't know which specific exam variant they got

## Auto-Grading Logic
- **MULTIPLE_CHOICE/TRUE_FALSE**: Exact match with correct options
- **FILL_IN_GAP**: Case-insensitive, trimmed comparison, partial credit
- **WORD_ORDERING**: Exact sequence match
- **MATCHING**: Set comparison, partial credit
- **OPEN_WRITING**: Requires manual grading
- **AUDIO_RESPONSE**: Delegates to sub-question type

## Scheduled Tasks
- **Attempt Expiry**: Runs every 5 minutes
  - Finds STARTED attempts past totalDuration
  - Sets status to EXPIRED
  - Logs expired count

## Development Status
See IMPLEMENTATION_PROGRESS.md for detailed status
