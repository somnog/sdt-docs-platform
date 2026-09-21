# Truck Management Service

**Group:** SD-Group 3  
**Track:** Software Development Track 3

---

## Group Members

| # | Name |
|---|------|
| 1 | Maxamed Mahdi |
| 2 | Ilyas Hassan Mohamed |
| 3 | Mohamed Nur Mumin |
---

## Service Overview

The **Truck Management Service** manages the three mobile training trucks used to deliver workshops. It tracks each truck's facilities, labs, rooms, equipment, and availability so that scheduling and session services can accurately assign the right truck to the right workshop.

---

## Responsibilities

- Manage the three training trucks
- Manage truck facilities, labs, and rooms
- Manage equipment, quantities, and truck contents
- Track truck availability and provide truck information

---

## API Endpoints (Suggested)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/trucks` | List all trucks |
| GET | `/trucks/:id` | Get truck details |
| PUT | `/trucks/:id` | Update truck information |
| GET | `/trucks/:id/equipment` | List equipment in a truck |
| PUT | `/trucks/:id/equipment` | Update equipment inventory |
| GET | `/trucks/:id/availability` | Check truck availability |
| PATCH | `/trucks/:id/availability` | Mark truck available or in use |

---

## Sample Data

```json
{
  "trucks": [
    {
      "truck_id": "TRK-001",
      "name": "Truck Alpha",
      "license_plate": "AA-1234",
      "status": "available",
      "facilities": {
        "labs": ["Mobile Lab A", "Mobile Lab B"],
        "rooms": ["Classroom Room 1"],
        "wifi": true,
        "generator": true
      },
      "equipment": [
        { "item": "Laptop", "quantity": 15, "condition": "good" },
        { "item": "Projector", "quantity": 1, "condition": "good" },
        { "item": "Whiteboard", "quantity": 2, "condition": "good" },
        { "item": "Extension Cables", "quantity": 8, "condition": "good" }
      ],
      "current_location": "Mogadishu",
      "assigned_workshop_id": null
    },
    {
      "truck_id": "TRK-002",
      "name": "Truck Beta",
      "license_plate": "BB-5678",
      "status": "in_use",
      "facilities": {
        "labs": ["Mobile Lab C"],
        "rooms": ["Classroom Room 2", "Classroom Room 3"],
        "wifi": true,
        "generator": true
      },
      "equipment": [
        { "item": "Laptop", "quantity": 15, "condition": "good" },
        { "item": "Projector", "quantity": 1, "condition": "fair" },
        { "item": "Whiteboard", "quantity": 1, "condition": "good" }
      ],
      "current_location": "Kismayo",
      "assigned_workshop_id": "WS-2025-001"
    },
    {
      "truck_id": "TRK-003",
      "name": "Truck Gamma",
      "license_plate": "CC-9012",
      "status": "maintenance",
      "facilities": {
        "labs": ["Mobile Lab D"],
        "rooms": ["Classroom Room 4"],
        "wifi": false,
        "generator": true
      },
      "equipment": [
        { "item": "Laptop", "quantity": 12, "condition": "fair" },
        { "item": "Projector", "quantity": 1, "condition": "good" }
      ],
      "current_location": "Garage",
      "assigned_workshop_id": null
    }
  ]
}
```

---

## Truck Status Values

| Status | Meaning |
|--------|---------|
| `available` | Truck is free and ready to be assigned |
| `in_use` | Truck is assigned to an active workshop |
| `maintenance` | Truck is undergoing maintenance |

---

## Notes

- There are exactly 3 trucks. The system should not allow creating additional trucks without admin authorization.
- Equipment quantities are updated after each workshop.
- The `truck_id` is shared with the Training Content & Schedule Service when assigning a truck to a workshop session.

---

## Prisma Schema

```prisma
// prisma/schema.prisma
// SD-Group 3 — Truck Management Service

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

enum TruckStatus {
  available
  in_use
  maintenance
}

enum EquipmentCondition {
  good
  fair
  poor
}

model Truck {
  id                  String      @id @default(auto()) @map("_id") @db.ObjectId
  truckId             String      @unique // e.g. "TRK-001"
  name                String      // e.g. "Truck Alpha"
  licensePlate        String      @unique
  status              TruckStatus @default(available)
  currentLocation     String
  assignedWorkshopId  String?     // FK → Workshop.workshopId (Group 1), null if not assigned
  wifi                Boolean     @default(false)
  generator           Boolean     @default(true)
  labs                String[]    // list of lab names
  rooms               String[]    // list of room names
  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt

  equipment           Equipment[]
}

model Equipment {
  id        String             @id @default(auto()) @map("_id") @db.ObjectId
  truckId   String             // FK → Truck.truckId
  item      String             // e.g. "Laptop"
  quantity  Int
  condition EquipmentCondition @default(good)
  updatedAt DateTime           @updatedAt

  truck     Truck              @relation(fields: [truckId], references: [truckId])
}
```

> **What these models do:**
> - `Truck` holds all physical and status information for each of the 3 training trucks.
> - `labs` and `rooms` are stored as string arrays — simple and flexible for listing facility names.
> - `assignedWorkshopId` is nullable: `null` means the truck is not currently assigned to any workshop.
> - `Equipment` is a separate model so items can be individually tracked, updated in quantity, and flagged by condition after each workshop.
> - `truckId` is the key shared with the Training Content & Schedule Service (Group 5) when building workshop schedules.
