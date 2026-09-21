# Facilitator Management Service

**Group:** SD-Group 4  
**Track:** Software Development Track 3

---

## Group Members

| # | Name |
|---|------|
| 1 | Aisha Mohamud Shamow |
| 2 | Abdiqani Yacqub Yacquub |
| 3 | Taqwa Zayn |
| 4 | Abdiweli Mohamed Abdi |

---

## Service Overview

The **Facilitator Management Service** manages the people who deliver training. It maintains profiles, expertise areas, skill levels, and availability status for all facilitators, and provides that information to the scheduling service so facilitators can be matched to the right training topics.

---

## Responsibilities

- Manage facilitator profiles and contact information
- Manage facilitator expertise areas and levels
- Manage facilitator status
- Support facilitator matching and provide facilitator information

---

## API Endpoints (Suggested)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/facilitators` | Add a new facilitator |
| GET | `/facilitators` | List all facilitators |
| GET | `/facilitators/:id` | Get facilitator profile |
| PUT | `/facilitators/:id` | Update facilitator details |
| PATCH | `/facilitators/:id/status` | Update facilitator status |
| GET | `/facilitators/:id/expertise` | Get expertise areas |
| PUT | `/facilitators/:id/expertise` | Update expertise areas |
| GET | `/facilitators/match?topic=:topic` | Find facilitators by topic |

---

## Sample Data

```json
{
  "facilitators": [
    {
      "facilitator_id": "FAC-001",
      "full_name": "Sabirin Mire Abukar",
      "email": "sabirin.mire@example.com",
      "phone": "617144703",
      "institution": "Jamhuriya University of Science and Technology (JUST)",
      "status": "active",
      "expertise": [
        { "topic": "Web Development", "level": "advanced" },
        { "topic": "HTML & CSS", "level": "expert" },
        { "topic": "JavaScript", "level": "intermediate" }
      ],
      "joined_at": "2024-01-15T08:00:00Z"
    },
    {
      "facilitator_id": "FAC-002",
      "full_name": "Ahmed Hassan Ahmed",
      "email": "ahmed.hassan@example.com",
      "phone": "614783963",
      "institution": "Jamhuriya University",
      "status": "active",
      "expertise": [
        { "topic": "Node.js & Express", "level": "advanced" },
        { "topic": "MongoDB", "level": "intermediate" },
        { "topic": "REST APIs", "level": "advanced" }
      ],
      "joined_at": "2024-03-10T08:00:00Z"
    },
    {
      "facilitator_id": "FAC-003",
      "full_name": "Ismail Abdulkadir Ali",
      "email": "ismail.ali@example.com",
      "phone": "617161841",
      "institution": "Jamhuriya University of Science and Technology",
      "status": "inactive",
      "expertise": [
        { "topic": "React", "level": "intermediate" },
        { "topic": "UI/UX Design", "level": "beginner" }
      ],
      "joined_at": "2024-06-01T08:00:00Z"
    }
  ]
}
```

---

## Expertise Levels

| Level | Meaning |
|-------|---------|
| `beginner` | Can introduce the topic |
| `intermediate` | Can teach core concepts with examples |
| `advanced` | Can teach deeply and handle Q&A |
| `expert` | Can design curriculum for the topic |

## Facilitator Status Values

| Status | Meaning |
|--------|---------|
| `active` | Available for assignment |
| `inactive` | Not currently available |
| `on_leave` | Temporarily unavailable |

---

## Notes

- `facilitator_id` is shared with the Training Content & Schedule Service for session assignments.
- A facilitator can have multiple expertise areas at different levels.
- The matching endpoint (`/facilitators/match`) is used by the scheduling service to suggest eligible facilitators for a given topic.

---

## Prisma Schema

```prisma
// prisma/schema.prisma
// SD-Group 4 — Facilitator Management Service

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

enum FacilitatorStatus {
  active
  inactive
  on_leave
}

enum ExpertiseLevel {
  beginner
  intermediate
  advanced
  expert
}

model Facilitator {
  id            String            @id @default(auto()) @map("_id") @db.ObjectId
  facilitatorId String            @unique // e.g. "FAC-001"
  fullName      String
  email         String            @unique
  phone         String
  institution   String
  status        FacilitatorStatus @default(active)
  joinedAt      DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  expertise     Expertise[]
}

model Expertise {
  id            String         @id @default(auto()) @map("_id") @db.ObjectId
  facilitatorId String         // FK → Facilitator.facilitatorId
  topic         String         // e.g. "Node.js & Express"
  level         ExpertiseLevel

  facilitator   Facilitator    @relation(fields: [facilitatorId], references: [facilitatorId])
}
```

> **What these models do:**
> - `Facilitator` holds profile, contact, and status information for each trainer.
> - `Expertise` is a separate model so one facilitator can hold many topic–level pairs. This is what powers the `/facilitators/match?topic=` query.
> - `facilitatorId` is the shared key consumed by Group 5 (schedule) and Group 6 (sessions) when assigning a facilitator to a training slot.
> - `status` controls whether the facilitator is eligible for assignment — only `active` facilitators should appear in matching results.
