# Training Content & Schedule Service

**Group:** SD-Group 5  
**Track:** Software Development Track 3

---

## Group Members

| # | Name |
|---|------|
| 1 | Bashir Mohamed |
| 2 | Asad Mohamed Ali |
| 3 | Abdifitah Mohamed Abdiaziz |

---

## Service Overview

The **Training Content & Schedule Service** manages the curriculum and timetable for workshops. It organizes training topics, links them to materials (PDFs, videos, slides), and builds schedules that connect each topic to a facilitator across the three workshop days.

---

## Responsibilities

- Manage training topics and descriptions
- Organize content for Day 1, Day 2, and Day 3
- Manage training materials such as PDFs, videos, slides, and links
- Manage training schedules and connect topics with facilitators

---

## API Endpoints (Suggested)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/topics` | Create a training topic |
| GET | `/topics` | List all topics |
| GET | `/topics/:id` | Get topic details |
| PUT | `/topics/:id` | Update a topic |
| POST | `/topics/:id/materials` | Add a material to a topic |
| GET | `/topics/:id/materials` | List materials for a topic |
| POST | `/schedules` | Create a schedule for a workshop |
| GET | `/schedules/:workshop_id` | Get schedule for a workshop |
| PUT | `/schedules/:id` | Update a schedule entry |

---

## Sample Data

```json
{
  "topics": [
    {
      "topic_id": "TOP-001",
      "title": "Introduction to the Web & HTML Basics",
      "description": "Covers how the web works, HTTP basics, and HTML structure.",
      "day": 1,
      "duration_minutes": 90,
      "materials": [
        {
          "material_id": "MAT-001",
          "type": "slides",
          "title": "Web & HTML Slides",
          "url": "https://materials.example.com/html-intro.pdf"
        },
        {
          "material_id": "MAT-002",
          "type": "video",
          "title": "How the Internet Works",
          "url": "https://materials.example.com/internet-video.mp4"
        }
      ]
    },
    {
      "topic_id": "TOP-002",
      "title": "CSS Styling & Responsive Design",
      "description": "Covers CSS selectors, flexbox, grid, and mobile-first design.",
      "day": 1,
      "duration_minutes": 90,
      "materials": [
        {
          "material_id": "MAT-003",
          "type": "pdf",
          "title": "CSS Reference Guide",
          "url": "https://materials.example.com/css-guide.pdf"
        }
      ]
    },
    {
      "topic_id": "TOP-003",
      "title": "JavaScript Fundamentals",
      "description": "Variables, functions, loops, DOM manipulation, and events.",
      "day": 2,
      "duration_minutes": 120,
      "materials": [
        {
          "material_id": "MAT-004",
          "type": "slides",
          "title": "JavaScript Slides",
          "url": "https://materials.example.com/js-slides.pdf"
        }
      ]
    }
  ],
  "schedules": [
    {
      "schedule_id": "SCH-001",
      "workshop_id": "WS-2025-001",
      "entries": [
        {
          "day": 1,
          "time_slot": "08:00–09:30",
          "topic_id": "TOP-001",
          "facilitator_id": "FAC-001"
        },
        {
          "day": 1,
          "time_slot": "10:00–11:30",
          "topic_id": "TOP-002",
          "facilitator_id": "FAC-001"
        },
        {
          "day": 2,
          "time_slot": "08:00–10:00",
          "topic_id": "TOP-003",
          "facilitator_id": "FAC-002"
        }
      ]
    }
  ]
}
```

---

## Material Types

| Type | Accepted Formats |
|------|-----------------|
| `slides` | PDF, PPTX |
| `video` | MP4, YouTube link |
| `pdf` | PDF |
| `link` | Any external URL |

---

## Notes

- Topics are organized into Day 1, Day 2, and Day 3 — matching the 3-day workshop format.
- `facilitator_id` is pulled from the Facilitator Management Service.
- `workshop_id` is pulled from the Workshop Management Service.
- A single topic can be reused across multiple workshop schedules.

---

## Prisma Schema

```prisma
// prisma/schema.prisma
// SD-Group 5 — Training Content & Schedule Service

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

enum MaterialType {
  slides
  video
  pdf
  link
}

model Topic {
  id              String     @id @default(auto()) @map("_id") @db.ObjectId
  topicId         String     @unique // e.g. "TOP-001"
  title           String
  description     String
  day             Int        // 1, 2, or 3
  durationMinutes Int

  materials       Material[]
  scheduleEntries ScheduleEntry[]
}

model Material {
  id         String       @id @default(auto()) @map("_id") @db.ObjectId
  materialId String       @unique // e.g. "MAT-001"
  topicId    String       // FK → Topic.topicId
  type       MaterialType
  title      String
  url        String

  topic      Topic        @relation(fields: [topicId], references: [topicId])
}

model Schedule {
  id         String          @id @default(auto()) @map("_id") @db.ObjectId
  scheduleId String          @unique // e.g. "SCH-001"
  workshopId String          // FK → Workshop.workshopId (Group 1)
  createdAt  DateTime        @default(now())
  updatedAt  DateTime        @updatedAt

  entries    ScheduleEntry[]
}

model ScheduleEntry {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  scheduleId    String   // FK → Schedule.scheduleId
  topicId       String   // FK → Topic.topicId
  facilitatorId String   // FK → Facilitator.facilitatorId (Group 4)
  truckId       String?  // FK → Truck.truckId (Group 3), optional
  day           Int      // 1, 2, or 3
  timeSlot      String   // e.g. "08:00–09:30"

  schedule      Schedule @relation(fields: [scheduleId], references: [scheduleId])
  topic         Topic    @relation(fields: [topicId], references: [topicId])
}
```

> **What these models do:**
> - `Topic` is the reusable curriculum unit — it can be linked into any workshop's schedule.
> - `Material` stores all learning resources (PDFs, videos, slides, links) attached to a topic. One topic can have many materials.
> - `Schedule` is the parent container for a workshop's full timetable, identified by `workshopId`.
> - `ScheduleEntry` is the line-level assignment: which topic, which facilitator, on which day and time slot. `truckId` is optional — set when the session is truck-based.
> - `facilitatorId` and `truckId` are cross-service references (Groups 4 and 3 respectively) stored as plain strings — no direct DB join across services.
