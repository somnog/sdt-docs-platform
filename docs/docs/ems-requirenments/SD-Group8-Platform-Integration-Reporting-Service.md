# Platform, Integration & Reporting Service

**Group:** SD-Group 8  
**Track:** Software Development Track 3

---

## Group Members

| # | Name |
|---|------|
| 1 | Idman Ahmed |
| 2 | Sahra Cabdirisaq |
| 3 | Abdullahi Omar Hussein |
---

## Service Overview

The **Platform, Integration & Reporting Service** is the backbone of the entire system. It provides the API Gateway that all other services sit behind, handles authentication and authorization, integrates the services into a unified API surface, builds the frontend and reporting dashboards, and manages deployment, testing, and monitoring infrastructure.

---

## Responsibilities

- Manage API Gateway, authentication, and authorization
- Integrate all services and expose unified APIs
- Build frontend, dashboards, and reports
- Manage Docker, deployment, testing, logging, and monitoring

---

## Architecture Overview

```
[Frontend / Dashboard]
        |
   [API Gateway]   ← Group 8 owns everything above this line
        |
 ┌──────┴──────────────────────────────────┐
 │  G1: Workshop   G2: Participant          │
 │  G3: Truck      G4: Facilitator          │
 │  G5: Content    G6: Attendance           │
 │  G7: Feedback & Certs                    │
 └──────────────────────────────────────────┘
```

---

## API Endpoints (Suggested — Gateway Level)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register a user account |
| POST | `/auth/login` | Login and receive a JWT token |
| POST | `/auth/refresh` | Refresh an access token |
| GET | `/health` | System health check |
| GET | `/reports/workshops` | Workshop participation summary |
| GET | `/reports/pass-fail/:workshop_id` | Pass/fail breakdown for a workshop |
| GET | `/reports/attendance/:workshop_id` | Attendance summary for a workshop |
| GET | `/reports/feedback/:workshop_id` | Aggregated feedback ratings |
| GET | `/reports/certificates` | Total certificates issued |

> All other endpoints (`/workshops`, `/participants`, `/trucks`, etc.) are proxied to the appropriate service through this gateway.

---

## Sample Data

```json
{
  "auth": {
    "users": [
      {
        "user_id": "USR-001",
        "name": "Sabirin Mire Abukar",
        "email": "sabirin.mire@example.com",
        "role": "participant",
        "created_at": "2025-08-10T09:00:00Z"
      },
      {
        "user_id": "USR-002",
        "name": "Ahmed Hassan Ahmed",
        "email": "ahmed.hassan@example.com",
        "role": "facilitator",
        "created_at": "2025-08-11T10:00:00Z"
      },
      {
        "user_id": "USR-003",
        "name": "Admin User",
        "email": "admin@bile-initiative.so",
        "role": "admin",
        "created_at": "2025-07-01T08:00:00Z"
      }
    ]
  },
  "reports": {
    "workshop_summary": {
      "workshop_id": "WS-2025-001",
      "title": "Introduction to Web Development",
      "total_enrolled": 32,
      "total_attended_day1": 30,
      "total_attended_day2": 28,
      "total_attended_day3": 27,
      "total_passed": 24,
      "total_failed": 8,
      "certificates_issued": 24,
      "average_feedback_rating": 4.6
    }
  },
  "infrastructure": {
    "services": [
      { "name": "workshop-service", "status": "running", "port": 3001 },
      { "name": "participant-service", "status": "running", "port": 3002 },
      { "name": "truck-service", "status": "running", "port": 3003 },
      { "name": "facilitator-service", "status": "running", "port": 3004 },
      { "name": "content-service", "status": "running", "port": 3005 },
      { "name": "attendance-service", "status": "running", "port": 3006 },
      { "name": "feedback-service", "status": "running", "port": 3007 },
      { "name": "api-gateway", "status": "running", "port": 8080 }
    ]
  }
}
```

---

## User Roles & Permissions

| Role | Access Level |
|------|-------------|
| `admin` | Full access to all services and reports |
| `facilitator` | Read access to schedules, sessions, and participant attendance |
| `participant` | Access to own profile, applications, results, and certificates |

---

## Authentication Flow

```
1. Client sends POST /auth/login with credentials
2. Gateway validates and returns { access_token, refresh_token }
3. Client includes Authorization: Bearer <access_token> on all requests
4. Gateway verifies token and routes request to the correct service
5. On expiry, client uses POST /auth/refresh to get a new access token
```

---

## Infrastructure Stack

| Component | Technology |
|-----------|-----------|
| Containerization | Docker |
| Process management | Docker Compose (development) |
| API Gateway | Node.js / Express or Nginx |
| Auth | JWT (JSON Web Tokens) |
| Logging | Console + file logs |
| Monitoring | Health check endpoints |

---

## Notes

- This service does not own business data — it integrates and exposes the other 7 services.
- All inter-service communication is handled behind the gateway; the frontend never calls individual services directly.
- Group 8 is responsible for the shared `.env` configuration template and Docker Compose file used by all groups.
- Deployment and testing pipelines should be documented in a separate `DEPLOYMENT.md` file within this service.

---

## Prisma Schema

```prisma
// prisma/schema.prisma
// SD-Group 8 — Platform, Integration & Reporting Service

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

enum UserRole {
  admin
  facilitator
  participant
}

enum TokenType {
  access
  refresh
}

model User {
  id        String     @id @default(auto()) @map("_id") @db.ObjectId
  userId    String     @unique // e.g. "USR-001"
  name      String
  email     String     @unique
  password  String     // hashed with bcrypt
  role      UserRole   @default(participant)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  tokens    AuthToken[]
  logs      AuditLog[]
}

model AuthToken {
  id        String    @id @default(auto()) @map("_id") @db.ObjectId
  userId    String    // FK → User.userId
  token     String    @unique
  type      TokenType
  expiresAt DateTime
  createdAt DateTime  @default(now())

  user      User      @relation(fields: [userId], references: [userId])
}

model AuditLog {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  userId    String   // FK → User.userId (who performed the action)
  action    String   // e.g. "LOGIN", "CREATE_WORKSHOP", "ENROLL_PARTICIPANT"
  service   String   // e.g. "workshop-service", "participant-service"
  details   String?  // optional JSON string with extra context
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [userId])
}
```

> **What these models do:**
> - `User` is the central auth identity for everyone on the platform — admins, facilitators, and participants all have a `User` record here. The `role` field controls access permissions enforced at the gateway level.
> - `AuthToken` stores issued JWT refresh tokens so they can be invalidated server-side on logout or expiry. Access tokens are stateless (short-lived JWTs, not stored in DB).
> - `AuditLog` records who did what and in which service — essential for admin dashboards and security reviews.
> - This service does **not** replicate business data from other services. Reports are built by calling other services' APIs and aggregating the results at runtime, not by storing copies of their data.
