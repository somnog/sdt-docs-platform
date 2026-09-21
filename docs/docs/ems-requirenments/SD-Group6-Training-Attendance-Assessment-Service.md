# Training, Attendance & Assessment Service

**Group:** SD-Group 6  
**Track:** Software Development Track 3

---

## Group Members

| # | Name |
|---|------|
| 1 | Dahir Abshir Abukar |
| 2 | Hudeifa Mohamud Ahmed |
| 3 | Farhio Hassan Abdulle |
| 4 | Shamso Mohamed Ali |

---

## Service Overview

The **Training, Attendance & Assessment Service** runs the operational day-to-day of each workshop. It tracks whether participants show up each day, assigns facilitators and topics to live sessions, records assessment scores, and calculates final PASS/FAIL results.

---

## Responsibilities

- Manage training sessions and daily attendance
- Assign facilitators and topics to sessions
- Manage assessments and participant scores
- Calculate results and determine PASS/FAIL

---

## API Endpoints (Suggested)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sessions` | Create a training session |
| GET | `/sessions/:id` | Get session details |
| POST | `/sessions/:id/attendance` | Record attendance for a session |
| GET | `/sessions/:id/attendance` | Get attendance list for a session |
| POST | `/assessments` | Create an assessment |
| POST | `/assessments/:id/scores` | Submit a participant's score |
| GET | `/assessments/:id/scores` | Get all scores for an assessment |
| GET | `/participants/:id/results/:workshop_id` | Get final PASS/FAIL result |

---

## Sample Data

```json
{
  "sessions": [
    {
      "session_id": "SES-001",
      "workshop_id": "WS-2025-001",
      "day": 1,
      "date": "2025-09-01",
      "facilitator_id": "FAC-001",
      "topic_id": "TOP-001",
      "time_slot": "08:00–09:30"
    },
    {
      "session_id": "SES-002",
      "workshop_id": "WS-2025-001",
      "day": 2,
      "date": "2025-09-02",
      "facilitator_id": "FAC-002",
      "topic_id": "TOP-003",
      "time_slot": "08:00–10:00"
    }
  ],
  "attendance": [
    {
      "session_id": "SES-001",
      "records": [
        { "participant_id": "P-001", "status": "present" },
        { "participant_id": "P-002", "status": "absent" },
        { "participant_id": "P-003", "status": "present" }
      ]
    }
  ],
  "assessments": [
    {
      "assessment_id": "ASS-001",
      "workshop_id": "WS-2025-001",
      "title": "Day 3 Final Assessment",
      "day": 3,
      "total_marks": 100,
      "pass_mark": 60,
      "scores": [
        {
          "participant_id": "P-001",
          "score": 82,
          "result": "PASS"
        },
        {
          "participant_id": "P-002",
          "score": 45,
          "result": "FAIL"
        },
        {
          "participant_id": "P-003",
          "score": 71,
          "result": "PASS"
        }
      ]
    }
  ]
}
```

---

## PASS/FAIL Logic

A participant **PASSES** the workshop if:

1. They attended at least **2 out of 3 days**, AND
2. They scored **60 or above** (out of 100) on the final assessment.

Otherwise, their result is **FAIL**.

---

## Attendance Status Values

| Status | Meaning |
|--------|---------|
| `present` | Participant attended the session |
| `absent` | Participant did not attend |
| `excused` | Absence was approved in advance |

---

## Notes

- `session_id`, `participant_id`, and `workshop_id` are all foreign keys from other services.
- Final results are consumed by the Feedback, Certificate & Notification Service to trigger certificate generation.
- Each workshop has exactly one final assessment (Day 3), but can have optional daily quizzes.

---

## Prisma Schema

```prisma
// prisma/schema.prisma
// SD-Group 6 — Training, Attendance & Assessment Service

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

enum AttendanceStatus {
  present
  absent
  excused
}

enum AssessmentResult {
  PASS
  FAIL
}

model Session {
  id            String           @id @default(auto()) @map("_id") @db.ObjectId
  sessionId     String           @unique // e.g. "SES-001"
  workshopId    String           // FK → Workshop.workshopId (Group 1)
  facilitatorId String           // FK → Facilitator.facilitatorId (Group 4)
  topicId       String           // FK → Topic.topicId (Group 5)
  day           Int              // 1, 2, or 3
  date          DateTime
  timeSlot      String           // e.g. "08:00–09:30"
  createdAt     DateTime         @default(now())

  attendance    AttendanceRecord[]
}

model AttendanceRecord {
  id            String           @id @default(auto()) @map("_id") @db.ObjectId
  sessionId     String           // FK → Session.sessionId
  participantId String           // FK → Participant.participantId (Group 2)
  status        AttendanceStatus @default(absent)
  recordedAt    DateTime         @default(now())

  session       Session          @relation(fields: [sessionId], references: [sessionId])
}

model Assessment {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  assessmentId String   @unique // e.g. "ASS-001"
  workshopId   String   // FK → Workshop.workshopId (Group 1)
  title        String
  day          Int      // typically 3 (final assessment)
  totalMarks   Int      @default(100)
  passMark     Int      @default(60)
  createdAt    DateTime @default(now())

  scores       Score[]
}

model Score {
  id            String           @id @default(auto()) @map("_id") @db.ObjectId
  assessmentId  String           // FK → Assessment.assessmentId
  participantId String           // FK → Participant.participantId (Group 2)
  score         Int
  result        AssessmentResult // computed: score >= passMark → PASS
  submittedAt   DateTime         @default(now())

  assessment    Assessment       @relation(fields: [assessmentId], references: [assessmentId])
}
```

> **What these models do:**
> - `Session` represents a live class slot within a workshop day. References `workshopId`, `facilitatorId`, and `topicId` from other services.
> - `AttendanceRecord` tracks each participant's presence per session. One record per participant per session.
> - `Assessment` is the test for a workshop (usually Day 3). `passMark` is configurable per assessment.
> - `Score` stores one result per participant per assessment. The `result` field (`PASS`/`FAIL`) is computed based on whether `score >= passMark` and should also factor in attendance (≥ 2 days present) in application logic.
> - `participantId` in both `AttendanceRecord` and `Score` is the cross-service reference to Group 2.
