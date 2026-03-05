# 🌿 Branche : Forum-management-and-complaints

## 📋 Vue d'ensemble

Cette branche contient l'implémentation complète de deux microservices essentiels pour la plateforme EnglishFlow :

- **Community Service** : Gestion du forum communautaire
- **Complaints Service** : Système de gestion des réclamations avec messagerie temps réel

---

## 🎯 Objectifs de la branche

### Fonctionnalités implémentées

✅ **Forum communautaire complet** avec catégories, topics, posts et réactions  
✅ **Système de réclamations avancé** avec workflow, priorisation et suivi  
✅ **Messagerie temps réel** entre étudiants et support (SSE)  
✅ **Architecture microservices** avec Eureka et API Gateway  
✅ **Documentation API** complète avec Swagger/OpenAPI  

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway (8080)                      │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼─────────┐      ┌───────▼──────────┐
│ Community       │      │ Complaints       │
│ Service         │      │ Service          │
│ Port: 8082      │      │ Port: 8087       │
│                 │      │                  │
│ - Forum         │      │ - Réclamations   │
│ - Topics        │      │ - Messagerie SSE │
│ - Posts         │      │ - Workflow       │
│ - Réactions     │      │ - Notifications  │
└────────┬────────┘      └────────┬─────────┘
         │                        │
    ┌────▼────┐              ┌────▼────┐
    │PostgreSQL│              │PostgreSQL│
    │community │              │complaints│
    └─────────┘              └──────────┘
         │
    ┌────▼────┐
    │  Redis  │
    │  Cache  │
    └─────────┘
```

---

## 📦 Services implémentés

### 1️⃣ Community Service (Port 8082)

**Responsabilité** : Gestion complète du forum communautaire

#### Fonctionnalités principales

- **Catégories hiérarchiques** : 5 catégories avec 17 sous-catégories
- **Topics** : Création, modification, épinglage, verrouillage
- **Posts** : Réponses aux topics avec pagination
- **Réactions** : Like, Helpful, Insightful avec compteurs optimisés
- **Recherche** : Full-text search dans les topics
- **Upload de fichiers** : Images, PDFs, vidéos (max 50MB)

#### Technologies

```yaml
Framework: Spring Boot 3.2.0
Langage: Java 17
Base de données: PostgreSQL
Cache: Redis
Service Discovery: Eureka Client
Documentation: SpringDoc OpenAPI
```

#### Endpoints clés

```http
# Catégories
GET    /community/categories
POST   /community/categories
GET    /community/categories/{id}

# Topics
GET    /community/topics/subcategory/{id}
POST   /community/topics
PUT    /community/topics/{id}/pin
PUT    /community/topics/{id}/lock

# Posts
GET    /community/posts/topic/{id}
POST   /community/posts
PUT    /community/posts/{id}

# Réactions
POST   /community/reactions/posts/{id}
GET    /community/reactions/posts/{id}/count

# Upload
POST   /community/files/upload
```

#### Structure du code

```
community-service/
├── client/              # Feign clients (ClubServiceClient + Fallback)
├── config/              # Cache, CORS, OpenAPI
├── controller/          # REST Controllers
│   ├── CategoryController
│   ├── TopicController
│   ├── PostController
│   ├── ReactionController
│   └── FileUploadController
├── dto/                # Data Transfer Objects (12 DTOs)
├── entity/             # JPA Entities
├── exception/          # Gestion des erreurs
├── repository/         # JPA Repositories
└── service/            # Logique métier
```

---

### 2️⃣ Complaints Service (Port 8087)

**Responsabilité** : Gestion des réclamations avec messagerie temps réel

#### Fonctionnalités principales

- **Gestion des réclamations** : CRUD complet avec validation
- **Workflow avancé** : 10 statuts avec historique complet
- **Système de priorité** : Calcul automatique (LOW, MEDIUM, HIGH, CRITICAL)
- **Risque académique** : Scoring automatique et alertes
- **Messagerie temps réel** : Communication étudiant ↔ tuteur 
- **Contrôle d'accès** : Sécurité granulaire par rôle
- **Historique complet** : Traçabilité de toutes les modifications

#### Technologies

```yaml
Framework: Spring Boot 3.2.0
Langage: Java 17
Base de données: PostgreSQL
Sécurité: Spring Security + JWT
Temps réel: Server-Sent Events (SSE)
Service Discovery: Eureka Client
```

#### Catégories de réclamations

```java
PEDAGOGICAL          // Problèmes pédagogiques
TECHNICAL            // Problèmes techniques
ADMINISTRATIVE       // Questions administratives
BEHAVIORAL           // Problèmes de comportement
PAYMENT              // Problèmes de paiement
SCHEDULE             // Problèmes d'horaires
OTHER                // Autres
```

#### Workflow des statuts

```
OPEN → IN_PROGRESS → RESOLVED → CLOSED
```

#### Endpoints clés

```http
# CRUD de base
POST   /complaints
GET    /complaints/my-complaints
GET    /complaints/{id}
PUT    /complaints/{id}
DELETE /complaints/{id}

# Filtrage
GET    /complaints/status/{status}
GET    /complaints/paginated/filter?userId=X&status=OPEN

# Vues spécialisées
GET    /complaints/academic/all
GET    /complaints/tutor/complaints
GET    /complaints/academic/critical
GET    /complaints/academic/overdue

# Workflow
POST   /complaints/{id}/status
GET    /complaints/{id}/history
GET    /complaints/{id}/history-with-names

# Messagerie 
POST   /complaints/{id}/messages
GET    /complaints/{id}/messages

```

#### Structure du code

```
complaints-service/
├── config/              # Security, CORS, RestTemplate
├── controller/          # ComplaintController (30+ endpoints)
├── dto/                # DTOs pour requêtes/réponses
├── entity/             # Entities (Complaint, Message, Workflow)
├── enums/              # Status, Priority, Category, RiskLevel
├── repository/         # JPA Repositories
├── security/           # JWT Filter et configuration
└── service/            # 6 services spécialisés
    ├── ComplaintService.java
    ├── AcademicComplaintService.java
    ├── ComplaintWorkflowService.java
    ├── ComplaintMessageService.java
    ├── ComplaintSecurityService.java
```

---

## 🚀 Installation et démarrage

### Prérequis

```bash
- Java 17+
- Maven 3.6+
- PostgreSQL 14+
- Redis 6+ (pour Community Service)
- Eureka Server en cours d'exécution
```

### 1. Créer les bases de données

```sql
CREATE DATABASE englishflow_community;
CREATE DATABASE englishflow_complaints;
```

### 2. Configuration

#### Community Service

```bash
cd backend/community-service
cp .env.example .env
```

Éditer `.env` :
```properties
DB_HOST=localhost
DB_PORT=5432
DB_NAME=englishflow_community
DB_USERNAME=postgres
DB_PASSWORD=postgres

REDIS_HOST=localhost
REDIS_PORT=6379

EUREKA_SERVER=http://localhost:8761/eureka/
```

#### Complaints Service

```bash
cd backend/complaints-service
cp .env.example .env
```

Éditer `.env` :
```properties
DB_HOST=localhost
DB_PORT=5432
DB_NAME=englishflow_complaints
DB_USERNAME=postgres
DB_PASSWORD=postgres

JWT_SECRET=your-secret-key-here
EUREKA_SERVER=http://localhost:8761/eureka/
```

### 3. Démarrer les services

```bash
# Terminal 1 - Community Service
cd backend/community-service
mvn clean install
mvn spring-boot:run

# Terminal 2 - Complaints Service
cd backend/complaints-service
mvn clean install
mvn spring-boot:run
```

### 4. Vérification

```bash
# Health checks
curl http://localhost:8082/actuator/health  # Community
curl http://localhost:8087/actuator/health  # Complaints

# Swagger UI
http://localhost:8082/swagger-ui.html       # Community
```

---

## 🔑 Fonctionnalités innovantes

### 1. Système de réactions (Community)

**Types** : Like 👍, Helpful ✅, Insightful 💡

**Fonctionnalités** :
- Contrainte d'unicité (1 réaction par user/post)
- Compteurs optimisés
- Weighted score pour trending posts


### 2. Circuit Breaker Pattern

**Implémentation** : `ClubServiceClient` + `ClubServiceClientFallback`

**Avantages** :
- Résilience en cas de service down
- Dégradation gracieuse
- Pas de cascade failures

### 3. Workflow avec historique complet

**Traçabilité** :
- Chaque changement de statut enregistré
- Acteur et timestamp
- Historique enrichi avec noms des utilisateurs

---

## 📊 Patterns et bonnes pratiques

### Architecture en couches

```
Controller → Service → Repository → Database
     ↓          ↓
    DTO      Entity
```

### DTOs (Data Transfer Objects)

**Pourquoi ?**
- Séparation présentation/persistance
- Sécurité (pas d'exposition directe des entités)
- Validation des données entrantes
- Évite les problèmes de lazy loading

**Types de DTOs** :
- **Request DTOs** : `CreateTopicRequest`, `CreateComplaintRequest`
- **Response DTOs** : `TopicDTO`, `ComplaintDTO`
- **Error DTOs** : `ErrorResponse`

### Gestion des erreurs

**GlobalExceptionHandler** dans les deux services :
- `ResourceNotFoundException` (404)
- `UnauthorizedException` (401)
- `DuplicateResourceException` (409)
- `ValidationException` (400)

### Sécurité

**Community Service** :
- CORS configuré
- Validation Jakarta

**Complaints Service** :
- Spring Security + JWT
- Contrôle d'accès granulaire par rôle
- `ComplaintSecurityService` pour vérifications

---

## 🧪 Tests et validation

### Scénario 1 : Forum communautaire (5 min)

```bash
# 1. Lister les catégories
GET http://localhost:8082/community/categories

# 2. Créer un topic
POST http://localhost:8082/community/topics
{
  "subCategoryId": 1,
  "title": "How to improve my pronunciation?",
  "content": "I need tips...",
  "userId": 1,
  "userName": "John Doe"
}

# 3. Ajouter une réponse
POST http://localhost:8082/community/posts
{
  "topicId": 1,
  "content": "Try listening to podcasts...",
  "userId": 2,
  "userName": "Jane Smith"
}

# 4. Ajouter une réaction
POST http://localhost:8082/community/reactions/posts/1
{
  "userId": 1,
  "type": "HELPFUL"
}
```

### Scénario 2 : Réclamation avec messagerie (5 min)

```bash
# 1. Créer une réclamation (étudiant)
POST http://localhost:8087/complaints
{
  "userId": 1,
  "targetRole": "TUTOR",
  "category": "PEDAGOGICAL",
  "subject": "Problème avec le cours d'anglais",
  "description": "Je ne comprends pas la leçon..."
}

# 2. Connexion SSE (étudiant)
const eventSource = new EventSource('http://localhost:8087/complaints/notifications/stream/1');

# 3. Tuteur répond
POST http://localhost:8087/complaints/1/messages
{
  "authorId": 5,
  "authorRole": "TUTOR",
  "content": "Bonjour, je vais vous aider..."
}

# 4. Étudiant reçoit notification instantanée via SSE
# 5. Étudiant voit le message sans recharger

# 6. Changer le statut
POST http://localhost:8087/complaints/1/status
{
  "status": "IN_PROGRESS",
  "actorId": 5,
  "actorRole": "TUTOR"
}

# 7. Voir l'historique
GET http://localhost:8087/complaints/1/history-with-names
```

---

## 📈 Métriques et monitoring

### Actuator endpoints

```bash
# Community Service
GET http://localhost:8082/actuator/health
GET http://localhost:8082/actuator/metrics

# Complaints Service
GET http://localhost:8087/actuator/health
GET http://localhost:8087/actuator/metrics
```

### Logs

```bash
# Community Service
tail -f backend/community-service/logs/community-service.log

# Complaints Service
tail -f backend/complaints-service/logs/complaints-service.log
```

---


## 🔄 Intégration avec les autres services

### Dépendances

**Community Service** :
- `club-service` : Vérification des memberships pour sous-catégories réservées
- `auth-service` : Récupération des noms d'utilisateurs

**Complaints Service** :
- `auth-service` : Authentification JWT et infos utilisateurs

### Communication

```
Community Service → ClubServiceClient (Feign) → Club Service
Complaints Service → RestTemplate → Auth Service
```

---

## 📝 Fichiers importants


### Configuration

- `backend/community-service/.env.example`
- `backend/complaints-service/.env.example`
- `backend/community-service/pom.xml`
- `backend/complaints-service/pom.xml`

### Code clé

**Community Service** :
- `CommunityController.java` : Endpoints principaux
- `FileUploadController.java` : Upload de fichiers
- `ClubServiceClient.java` + `ClubServiceClientFallback.java` : Circuit Breaker

**Complaints Service** :
- `ComplaintController.java` : 30+ endpoints
- `ComplaintMessageService.java` : Messagerie 
- `ComplaintWorkflowService.java` : Gestion du workflow

---

## 🐛 Troubleshooting

### Problème : Service ne démarre pas

```bash
# Vérifier que PostgreSQL est démarré
psql -U postgres -l

# Vérifier que Redis est démarré (pour Community)
redis-cli ping

# Vérifier que Eureka est accessible
curl http://localhost:8761
```

### Problème : Erreur de connexion à la base de données

```bash
# Vérifier les credentials dans .env
cat backend/community-service/.env

# Tester la connexion
psql -U postgres -d englishflow_community
```

---

## 🚀 Prochaines étapes

### Améliorations possibles

- [ ] Tests unitaires et d'intégration
- [ ] Rate limiting pour les APIs
- [ ] Pagination côté frontend
- [ ] Export de données (PDF, Excel)
- [ ] Statistiques avancées
- [ ] Modération automatique (forum)

---

## 👥 Contributeurs

Cette branche a été développée dans le cadre du projet EnglishFlow.

---

## 📄 Licence

Projet académique - EnglishFlow Platform

---

**Dernière mise à jour** : Mars 2026  
**Version** : 1.0.0  
**Branche** : `Forum-management-and-complaints`
