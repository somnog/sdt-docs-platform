# Workshop Management Service

**Group:** SD-Group 1  
**Track:** Software Development Track 3

---

## Group Members

| # | Name |
|---|------|
| 1 | Sabirin Mire Abukar |
| 2 | Ahmed Hassan Ahmed |
| 3 | Cabdullahi Ahmed Cabdullahi |

---

## Service Overview

The **Workshop Management Service** is responsible for creating, managing, and exposing information about workshops. It serves as the foundational data source that other services rely on to know which workshops exist and when they are open for registration.

---

## Responsibilities

- Create and manage workshops
- Manage workshop year, workshop number, location, dates, and capacity
- Manage workshop status and registration opening/closing
- Provide workshop information and `workshop_id` to other services

---

## API Endpoints (Suggested)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/workshops` | Create a new workshop |
| GET | `/workshops` | List all workshops |
| GET | `/workshops/:id` | Get workshop by ID |
| PUT | `/workshops/:id` | Update workshop details |
| PATCH | `/workshops/:id/status` | Open or close registration |
| DELETE | `/workshops/:id` | Delete a workshop |

---

## Sample Data

```json
{
  "workshops": [
    {
      "workshop_id": "WS-2025-001",
      "workshop_number": 1,
      "year": 2025,
      "title": "Introduction to Web Development",
      "location": "Mogadishu Training Center — Room A",
      "start_date": "2025-09-01",
      "end_date": "2025-09-14",
      "capacity": 32,
      "status": "open",
      "registration_open": true,
      "created_at": "2025-08-01T08:00:00Z"
    },
    {
      "workshop_id": "WS-2025-002",
      "workshop_number": 2,
      "year": 2025,
      "title": "Advanced JavaScript & React",
      "location": "Mogadishu Training Center — Room B",
      "start_date": "2025-10-01",
      "end_date": "2025-10-14",
      "capacity": 32,
      "status": "upcoming",
      "registration_open": false,
      "created_at": "2025-08-15T08:00:00Z"
    }
  ]
}
```

---

## Notes

- `workshop_id` is the primary key shared with all other services.
- Registration status (`registration_open`) must be toggled explicitly — it does not change automatically.
- Capacity is the maximum number of enrolled participants allowed.

---

## Prisma Schema

```prisma
// prisma/schema.prisma
// SD-Group 1 — Workshop Management Service

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

enum WorkshopStatus {
  upcoming
  open
  ongoing
  completed
  cancelled
}

model Workshop {
  id               String         @id @default(auto()) @map("_id") @db.ObjectId
  workshopId       String         @unique // e.g. "WS-2025-001"
  workshopNumber   Int
  year             Int
  title            String
  location         String
  startDate        DateTime
  endDate          DateTime
  capacity         Int
  status           WorkshopStatus @default(upcoming)
  registrationOpen Boolean        @default(false)
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
}
```

> **What this model does:**
> - `workshopId` is the human-readable key (e.g. `WS-2025-001`) shared with every other service.
> - `status` controls the lifecycle of the workshop.
> - `registrationOpen` is a separate boolean flag so registration can be opened/closed independently of the status.
> - `capacity` is enforced by the Participant & Application Service when enrolling participants.
