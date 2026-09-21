# Feedback, Certificate & Notification Service

**Group:** SD-Group 7  
**Track:** Software Development Track 3

---

## Group Members

| # | Name |
|---|------|
| 1 | Ruweyda Abdulqadir Adam |
| 2 | Abuubakar Ciise Maxamuud |
| 3 | Hiba Ali Mohamed |

---

## Service Overview

The **Feedback, Certificate & Notification Service** closes the loop for every participant after a workshop. It collects their feedback, issues certificates to those who passed, and sends timely notifications — enrollment confirmations, result announcements, and reminders — throughout the workshop lifecycle.

---

## Responsibilities

- Collect participant feedback, ratings, and comments
- Generate certificates and certificate numbers
- Send enrollment, result, and reminder notifications
- Track notification status and provide feedback/certificate information

---

## API Endpoints (Suggested)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/feedback` | Submit feedback for a workshop |
| GET | `/feedback/:workshop_id` | Get all feedback for a workshop |
| GET | `/feedback/participant/:participant_id` | Get feedback submitted by a participant |
| POST | `/certificates/generate` | Generate a certificate for a participant |
| GET | `/certificates/:certificate_number` | Get certificate details |
| GET | `/certificates/participant/:participant_id` | List certificates for a participant |
| POST | `/notifications/send` | Send a notification |
| GET | `/notifications/:participant_id` | Get notification history for a participant |
| PATCH | `/notifications/:id/status` | Update notification delivery status |

---

## Sample Data

```json
{
  "feedback": [
    {
      "feedback_id": "FB-001",
      "participant_id": "P-001",
      "workshop_id": "WS-2025-001",
      "rating": 5,
      "comment": "The workshop was very well organized. The facilitators explained everything clearly and the hands-on sessions were very helpful.",
      "submitted_at": "2025-09-14T16:00:00Z"
    },
    {
      "feedback_id": "FB-002",
      "participant_id": "P-003",
      "workshop_id": "WS-2025-001",
      "rating": 4,
      "comment": "Great content. I would have liked more time on JavaScript topics.",
      "submitted_at": "2025-09-14T16:15:00Z"
    }
  ],
  "certificates": [
    {
      "certificate_id": "CERT-001",
      "certificate_number": "BILE-2025-WS001-P001",
      "participant_id": "P-001",
      "participant_name": "Sabirin Mire Abukar",
      "workshop_id": "WS-2025-001",
      "workshop_title": "Introduction to Web Development",
      "issued_at": "2025-09-15T08:00:00Z",
      "valid": true
    }
  ],
  "notifications": [
    {
      "notification_id": "NOT-001",
      "participant_id": "P-001",
      "type": "enrollment_confirmation",
      "channel": "sms",
      "message": "You have been successfully enrolled in 'Introduction to Web Development' starting 2025-09-01.",
      "sent_at": "2025-08-25T09:00:00Z",
      "status": "delivered"
    },
    {
      "notification_id": "NOT-002",
      "participant_id": "P-001",
      "type": "result",
      "channel": "sms",
      "message": "Congratulations! You have PASSED the workshop. Your certificate number is BILE-2025-WS001-P001.",
      "sent_at": "2025-09-15T08:05:00Z",
      "status": "delivered"
    },
    {
      "notification_id": "NOT-003",
      "participant_id": "P-002",
      "type": "reminder",
      "channel": "sms",
      "message": "Reminder: Your workshop starts tomorrow, 2025-09-01, at 08:00 AM. Please be on time.",
      "sent_at": "2025-08-31T18:00:00Z",
      "status": "delivered"
    }
  ]
}
```

---

## Notification Types

| Type | When It Is Sent |
|------|----------------|
| `enrollment_confirmation` | After a participant is enrolled in a workshop |
| `reminder` | 1 day before the workshop starts |
| `result` | After final assessment results are calculated |
| `certificate_ready` | When a certificate has been generated |

## Notification Channels

| Channel | Notes |
|---------|-------|
| `sms` | Primary channel (phone number required) |
| `email` | Secondary channel (email required) |

---

## Certificate Number Format

```
BILE-{YEAR}-{WORKSHOP_ID}-{PARTICIPANT_ID}
Example: BILE-2025-WS001-P001
```

---

## Notes

- Certificates are only generated for participants with a PASS result — confirmed via the Training, Attendance & Assessment Service.
- Feedback is optional but collected from all enrolled participants.
- Notification status (`sent`, `delivered`, `failed`) should be tracked for delivery reliability.
- This service provides certificate and feedback data to the Platform & Reporting Service (Group 8) for dashboards.

---

## Prisma Schema

```prisma
// prisma/schema.prisma
// SD-Group 7 — Feedback, Certificate & Notification Service

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

enum NotificationType {
  enrollment_confirmation
  reminder
  result
  certificate_ready
}

enum NotificationChannel {
  sms
  email
}

enum NotificationStatus {
  sent
  delivered
  failed
}

model Feedback {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  feedbackId    String   @unique // e.g. "FB-001"
  participantId String   // FK → Participant.participantId (Group 2)
  workshopId    String   // FK → Workshop.workshopId (Group 1)
  rating        Int      // 1–5
  comment       String?
  submittedAt   DateTime @default(now())
}

model Certificate {
  id                String   @id @default(auto()) @map("_id") @db.ObjectId
  certificateId     String   @unique // e.g. "CERT-001"
  certificateNumber String   @unique // e.g. "BILE-2025-WS001-P001"
  participantId     String   // FK → Participant.participantId (Group 2)
  participantName   String   // denormalized for display on the certificate
  workshopId        String   // FK → Workshop.workshopId (Group 1)
  workshopTitle     String   // denormalized for display on the certificate
  issuedAt          DateTime @default(now())
  valid             Boolean  @default(true)
}

model Notification {
  id             String              @id @default(auto()) @map("_id") @db.ObjectId
  notificationId String              @unique // e.g. "NOT-001"
  participantId  String              // FK → Participant.participantId (Group 2)
  type           NotificationType
  channel        NotificationChannel @default(sms)
  message        String
  status         NotificationStatus  @default(sent)
  sentAt         DateTime            @default(now())
  updatedAt      DateTime            @updatedAt
}
```

> **What these models do:**
> - `Feedback` captures a 1–5 rating and optional comment from each participant after their workshop. One feedback record per participant per workshop.
> - `Certificate` stores the issued certificate with a unique human-readable `certificateNumber`. `participantName` and `workshopTitle` are denormalized so the certificate can be rendered without calling other services.
> - `Notification` tracks every message sent to a participant — type, channel, delivery status, and timestamp. `status` is updated as the message moves through the delivery pipeline.
> - All three models reference `participantId` (Group 2) and `workshopId` (Group 1) as plain string cross-service keys.
