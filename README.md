# Jungle in English - English Learning Platform

## Overview

**Developed at Esprit School of Engineering – Tunisia**

This project was developed as part of the PI (Integrated Project) – 4th Year Engineering Program at Esprit School of Engineering (Academic Year 2025-2026).

Jungle in English (EnglishFlow) is a comprehensive microservices-based platform for English language learning, featuring interactive courses, real-time communication, gamification, community forums, and advanced authentication mechanisms.

The platform serves three main user roles:
- **Students**: Access courses, participate in forums, join clubs, track progress, and engage with learning materials
- **Tutors**: Create and manage courses, monitor student performance, handle complaints
- **Administrators**: Oversee platform operations, user management, and content moderation

---

## Features

### Authentication & Security
- JWT-based authentication with secure token management
- OAuth2 integration (Google Sign-In)
- Email verification and account activation
- Password reset functionality with secure tokens
- Two-Factor Authentication (2FA) support
- Role-based access control (RBAC)
- Rate limiting and brute-force protection

### User Management
- User registration with email validation
- Profile management with photo upload
- Multi-role support (Student, Tutor, Admin)
- Public user profiles

### Course Management
- Course creation and management
- Interactive learning modules with chapters and lessons
- Progress tracking and analytics
- Multimedia content support (videos, documents, images)
- Course enrollment system
- Course packs and categories

### Learning Resources
- E-books library with reviews and ratings
- Reading progress tracking
- Personal collections management
- Resource sharing and recommendations

### Exam System
- Comprehensive exam creation and management
- Multiple question types support
- Exam attempts tracking
- Automated grading system
- Detailed exam results and analytics

### Communication & Messaging
- Real-time messaging system with WebSocket
- Group conversations
- Direct messaging between users
- Message notifications
- Email notifications with professional templates

### Community Features
- Discussion forums with topics and replies
- Forum moderation tools
- Resource attachments (images, documents, videos)
- Student clubs and groups
- Club membership management
- Club tasks and activities

### Events Management
- Event creation and scheduling
- Event participation and registration
- Event feedback and ratings
- Event approval workflow
- Public events calendar

### Complaints System
- Complaint submission and tracking
- Real-time conversation threads
- Academic and general complaints
- Complaint workflow management
- Multi-role complaint handling (Student, Tutor, Admin)

### Gamification
- Points and rewards system
- User levels and progression
- Achievement badges
- Leaderboards
- Activity tracking

---

## Tech Stack

### Frontend
- **Framework**: Angular 18
- **Language**: TypeScript 5.5
- **Styling**: Tailwind CSS, Bootstrap 5
- **State Management**: RxJS
- **Charts**: ApexCharts, AmCharts 5
- **UI Components**: Angular CDK, FullCalendar, SweetAlert2
- **Security**: ng-recaptcha
- **Real-time**: WebSocket (SockJS, STOMP)

### Backend
- **Framework**: Spring Boot 3.2.0
- **Language**: Java 17
- **Architecture**: Microservices with Spring Cloud
- **Service Discovery**: Netflix Eureka
- **API Gateway**: Spring Cloud Gateway
- **Configuration**: Spring Cloud Config Server
- **Security**: Spring Security, JWT, OAuth2
- **Database**: PostgreSQL 14+
- **ORM**: Spring Data JPA
- **Caching**: Redis, Caffeine
- **Email**: Spring Mail with Thymeleaf templates
- **WebSocket**: Spring WebSocket with STOMP
- **Documentation**: SpringDoc OpenAPI (Swagger)
- **Monitoring**: Spring Actuator, Micrometer, Prometheus
- **Build Tool**: Maven 3.8+

---

## Architecture

### Microservices Overview

The platform consists of 13 microservices:

| Service | Port | Description |
|---------|------|-------------|
| Config Server | 8888 | Centralized configuration management |
| Eureka Server | 8761 | Service registry and discovery |
| API Gateway | 8080 | API routing and load balancing |
| Auth Service | 8081 | Authentication and user management |
| Community Service | 8082 | Forums and discussions |
| Learning Service | 8083 | E-books and learning resources |
| Messaging Service | 8084 | Real-time messaging and WebSocket |
| Club Service | 8085 | Student clubs and groups |
| Courses Service | 8086 | Course management and enrollment |
| Exam Service | 8087 | Exams and assessments |
| Event Service | 8088 | Events and activities |
| Complaints Service | 8089 | Complaint management system |
| Gamification Service | 8090 | Points, levels and achievements |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Angular Frontend                        │
│                       (Port 4200)                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (8080)                        │
│              Load Balancing & Routing                        │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┬─────────────┐
        │                │                │             │
        ▼                ▼                ▼             ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Auth Service │  │  Community   │  │  Learning    │  │  Messaging   │
│   (8081)     │  │   Service    │  │   Service    │  │   Service    │
│              │  │   (8082)     │  │   (8083)     │  │   (8084)     │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
        │                │                │                    │
        ▼                ▼                ▼                    ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Club        │  │  Courses     │  │  Exam        │  │  Event       │
│  Service     │  │  Service     │  │  Service     │  │  Service     │
│   (8085)     │  │   (8086)     │  │   (8087)     │  │   (8088)     │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
        │                │                │                    │
        ▼                ▼                ▼                    ▼
┌──────────────┐  ┌──────────────┐
│ Complaints   │  │Gamification  │
│  Service     │  │  Service     │
│   (8089)     │  │   (8090)     │
└──────────────┘  └──────────────┘
        │                │
        └────────────────┴────────────────┐
                         │                │
        ┌────────────────┴────────────────┘
        │                                  │
        ▼                                  ▼
┌──────────────────┐            ┌──────────────────┐
│  Eureka Server   │            │  Config Server   │
│     (8761)       │            │      (8888)      │
│Service Discovery │            │  Centralized     │
└──────────────────┘            │  Configuration   │
                                └──────────────────┘
```

---

## Contributors

### Development Team - Class 4SAE1

- **Khalil Abdelmoumen**
- **Kenza Baccar**
- **Nadhem Hmida**
- **Ismail Ismail**
- **Mohamed Aziz Louati**

### Academic Supervision

- **Academic Supervisor**: Monsieur Khaled Hamrouni

---

## Academic Context

**Developed at Esprit School of Engineering – Tunisia**

- **Program**: Software Engineering
- **Project Type**: PI (Integrated Project)
- **Academic Year**: 2025-2026
- **Class**: 4SAE1

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Java** 17 (JDK)
- **PostgreSQL** 14+
- **Maven** 3.8+
- **Git**
- **Redis** (optional, for caching)

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/Khaalilabd/EnglishFlow-PI.git
cd EnglishFlow-PI
```

#### 2. Database Setup

Create PostgreSQL databases:

```sql
CREATE DATABASE englishflow_identity;
CREATE DATABASE englishflow_community;
CREATE DATABASE englishflow_learning_db;
CREATE DATABASE englishflow_messaging_db;
CREATE DATABASE englishflow_jungle_club_db;
CREATE DATABASE englishflow_courses;
CREATE DATABASE englishflow_exams;
CREATE DATABASE event_db;
CREATE DATABASE englishflow_complaints;
CREATE DATABASE englishflow_gamification;

CREATE USER englishflow WITH PASSWORD 'englishflow123';
GRANT ALL PRIVILEGES ON DATABASE englishflow_identity TO englishflow;
-- Repeat for all databases
```

#### 3. Backend Configuration

Configure environment variables in `backend/auth-service/.env`:

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FRONTEND_URL=http://localhost:4200
DB_URL=jdbc:postgresql://localhost:5432/englishflow_identity
DB_USERNAME=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-secure-jwt-secret-key
JWT_EXPIRATION=86400000
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-gmail-app-password
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key
```

#### 4. Start Backend Services

Start services in order:

```bash
# Config Server (8888)
cd backend/config-server
mvn spring-boot:run

# Eureka Server (8761)
cd backend/eureka-server
mvn spring-boot:run

# API Gateway (8080)
cd backend/api-gateway
mvn spring-boot:run

# Auth Service (8081)
cd backend/auth-service
mvn spring-boot:run

# Other services...
```

#### 5. Start Frontend

```bash
cd frontend
npm install
npm start
```

#### 6. Access Application

- **Frontend**: http://localhost:4200
- **Eureka Dashboard**: http://localhost:8761
- **API Gateway**: http://localhost:8080

### Service Endpoints

| Service | Port | Swagger UI | Health Check |
|---------|------|------------|--------------|
| Config Server | 8888 | N/A | http://localhost:8888/actuator/health |
| Eureka Server | 8761 | N/A | http://localhost:8761 |
| API Gateway | 8080 | N/A | http://localhost:8080/actuator/health |
| Auth Service | 8081 | http://localhost:8081/swagger-ui.html | http://localhost:8081/actuator/health |
| Community Service | 8082 | http://localhost:8082/swagger-ui.html | http://localhost:8082/actuator/health |
| Learning Service | 8083 | N/A | http://localhost:8083/actuator/health |
| Messaging Service | 8084 | http://localhost:8084/swagger-ui.html | http://localhost:8084/actuator/health |
| Club Service | 8085 | http://localhost:8085/swagger-ui.html | http://localhost:8085/actuator/health |
| Courses Service | 8086 | N/A | http://localhost:8086/actuator/health |
| Exam Service | 8087 | N/A | http://localhost:8087/actuator/health |
| Event Service | 8088 | http://localhost:8088/swagger-ui.html | http://localhost:8088/actuator/health |
| Complaints Service | 8089 | N/A | http://localhost:8089/actuator/health |
| Gamification Service | 8090 | N/A | N/A |

---

## Documentation

### Service Documentation
- [Auth Service Setup Guide](./backend/auth-service/docs/README.md)
- [Gmail SMTP Configuration](./backend/auth-service/docs/GMAIL_SETUP.md)
- [OAuth2 Configuration](./backend/auth-service/docs/OAUTH2_SETUP.md)
- [2FA Implementation](./backend/auth-service/docs/2FA_IMPLEMENTATION.md)
- [API Documentation](./backend/auth-service/docs/API_DOCUMENTATION.md)
- [Monitoring Guide](./backend/auth-service/docs/MONITORING_GUIDE.md)

### API Documentation
Swagger/OpenAPI documentation available at: `http://localhost:<port>/swagger-ui.html`

### Postman Collection
- `backend/auth-service/postman_collection.json`

---

## Acknowledgments

### Special Thanks

- **Esprit School of Engineering** for providing the academic framework and resources
- **Monsieur Khaled Hamrouni** for his guidance and mentorship throughout the project
- **Spring Boot & Angular Communities** for excellent documentation and support
- **Open Source Contributors** for the libraries and tools used in this project

### Resources & References

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Angular Documentation](https://angular.io/docs)
- [Spring Cloud Documentation](https://spring.io/projects/spring-cloud)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Microservices Patterns](https://microservices.io/patterns/)

---

**Made with ❤️ by 4SAE1 Team - Esprit School of Engineering**

---

## Topics

`esprit-school-of-engineering` `academic-project` `esprit-pi` `2025-2026` `angular` `spring-boot` `microservices` `java` `typescript` `postgresql` `english-learning` `e-learning-platform` `jwt-authentication` `oauth2` `websocket` `real-time-messaging` `gamification` `docker`
