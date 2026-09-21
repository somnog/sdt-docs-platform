# Participant & Application Service

**Group:** SD-Group 2  
**Track:** Software Development Track 3

---

## Group Members

| # | Name |
|---|------|
| 1 | Bakar Mohamed Hussein |
| 2 | Mandeq Ali Ibrahim |
| 3 | Cabdulaahi Ahmed Jimcaale |

---

## Service Overview

The **Participant & Application Service** manages everything related to participants — from account creation and profile management to applying for workshops and tracking application status. It is the entry point for all learners joining the platform.

---

## Responsibilities

- Register and manage participants
- Manage participant profiles and accounts
- Manage applications and application status
- Handle approval/rejection and enrollment

---

## API Endpoints (Suggested)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/participants` | Register a new participant |
| GET | `/participants/:id` | Get participant profile |
| PUT | `/participants/:id` | Update participant profile |
| POST | `/applications` | Submit a workshop application |
| GET | `/applications/:id` | Get application details |
| PATCH | `/applications/:id/status` | Approve, reject, or enroll |
| GET | `/participants/:id/applications` | List all applications by a participant |

---

## Sample Data

```json
{
  "participants": [
    {
      "participant_id": "P-001",
      "full_name": "Sabirin Mire Abukar",
      "sex": "Female",
      "institution": "Jamhuriya University of Science and Technology (JUST)",
      "phone": "617144703",
      "email": "sabirin.mire@example.com",
      "created_at": "2025-08-10T09:00:00Z"
    },
    {
      "participant_id": "P-002",
      "full_name": "Ahmed Hassan Ahmed",
      "sex": "Male",
      "institution": "Jamhuriya University",
      "phone": "614783963",
      "email": "ahmed.hassan@example.com",
      "created_at": "2025-08-11T10:30:00Z"
    }
  ],
  "applications": [
    {
      "application_id": "APP-001",
      "participant_id": "P-001",
      "workshop_id": "WS-2025-001",
      "applied_at": "2025-08-20T08:00:00Z",
      "status": "enrolled"
    },
    {
      "application_id": "APP-002",
      "participant_id": "P-002",
      "workshop_id": "WS-2025-001",
      "applied_at": "2025-08-21T11:00:00Z",
      "status": "pending"
    }
  ]
}
```

---

## Application Status Flow

```
pending → approved → enrolled
pending → rejected
```

---

## Notes

- `participant_id` is the primary key shared with other services (attendance, assessment, certificates).
- Each participant may apply to multiple workshops, but only one active enrollment per workshop.
- Requires `workshop_id` from the Workshop Management Service to validate applications.

---

## Prisma Schema

```prisma
// prisma/schema.prisma
// SD-Group 2 — Participant & Application Service

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

enum Sex {
  Male
  Female
}

enum ApplicationStatus {
  pending
  approved
  rejected
  enrolled
}

model Participant {
  id          String        @id @default(auto()) @map("_id") @db.ObjectId
  participantId String      @unique // e.g. "P-001"
  fullName    String
  sex         Sex
  institution String
  phone       String
  email       String        @unique
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  applications Application[]
}

model Application {
  id            String            @id @default(auto()) @map("_id") @db.ObjectId
  applicationId String            @unique // e.g. "APP-001"
  participantId String            // FK → Participant.participantId
  workshopId    String            // FK → Workshop.workshopId (Group 1)
  status        ApplicationStatus @default(pending)
  appliedAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  participant   Participant       @relation(fields: [participantId], references: [participantId])
}
```

> **What these models do:**
> - `Participant` stores all personal info for a learner. `participantId` is the shared key used by Groups 6, 7, and 8.
> - `Application` links a participant to a workshop. The `workshopId` is a reference to Group 1's service — no direct DB join, just a stored ID.
> - The `status` field drives the enrollment flow: `pending → approved → enrolled` or `pending → rejected`.
> - One participant can have many applications (one per workshop), enforced by the unique constraint on `(participantId, workshopId)` if needed.
