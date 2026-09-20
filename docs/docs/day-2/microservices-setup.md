---
sidebar_position: 1
title: Microservices Setup
description: Step-by-step guide for setting up a NestJS microservices project with Prisma and RabbitMQ.
---

# Microservices Setup

This guide walks through the basic setup of a **NestJS microservices architecture** using:

- NestJS
- Prisma
- PostgreSQL
- RabbitMQ
- NestJS Microservices

The project will contain the following services:

- API Gateway
- Authentication Service
- Event Service
- Notification Service

---

## 1. Create the Project Structure

Create the main project directory:

```bash
mkdir somnogems && cd somnogems
```

Create an `apps` directory for the services:

```bash
mkdir -p apps && cd apps
```

Create the NestJS applications:

```bash
nest new gateway
nest new auth-service
nest new event-service
nest new notification-service
```

After completing these commands, the project structure should look similar to this:

```text
somnogems/
└── apps/
    ├── gateway/
    ├── auth-service/
    ├── event-service/
    └── notification-service/
```

---

## 2. Install Service Packages

Each microservice may require additional packages depending on its responsibilities.

For example, enter the `event-service` directory:

```bash
cd apps/event-service
```

Install the required NestJS microservices, RabbitMQ, configuration, and validation packages:

```bash
npm install @nestjs/microservices@^11 @nestjs/config amqplib amqp-connection-manager class-validator class-transformer dotenv
```

### Package Overview

| Package | Purpose |
| --- | --- |
| `@nestjs/microservices` | Adds NestJS support for microservice transports such as RabbitMQ |
| `@nestjs/config` | Loads and manages application configuration |
| `amqplib` | RabbitMQ client library for Node.js |
| `amqp-connection-manager` | Helps manage RabbitMQ connections and reconnections |
| `class-validator` | Provides DTO validation decorators |
| `class-transformer` | Transforms plain objects into class instances |
| `dotenv` | Loads environment variables from `.env` files |

---

## 3. Prisma Setup

Prisma will be used as the ORM for communicating with PostgreSQL.

For the official NestJS + Prisma setup guide, see:

[Prisma NestJS Guide](https://www.prisma.io/docs/guides/v7/frameworks/nestjs)

### Install Prisma

Install Prisma as a development dependency:

```bash
npm install prisma@prev --save-dev
```

Install Prisma Client, the PostgreSQL adapter, and the PostgreSQL driver:

```bash
npm install @prisma/client@7 @prisma/adapter-pg pg
```

### Initialize Prisma

Run:

```bash
npx prisma init --output ../src/generated/prisma
```

Then generate the Prisma Client:

```bash
npx prisma generate
```

After initialization, Prisma creates files such as:

```text
prisma/
└── schema.prisma
```

You will also configure your database connection using the `DATABASE_URL` environment variable.

Example `.env` file:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/somnogems"
```

:::warning

Do not commit real database passwords or production credentials to Git.

:::

---

## 4. Create the Prisma Service

Create the following file:

```text
src/prisma.service.ts
```

Add:

```ts
import { Injectable } from "@nestjs/common";
import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL as string,
    });

    super({ adapter });
  }
}
```

### What This Service Does

`PrismaService` extends `PrismaClient`, which allows NestJS services to access the database through dependency injection.

The PostgreSQL adapter reads the database connection from:

```env
DATABASE_URL
```

You can then inject `PrismaService` into other NestJS services.

Example:

```ts
constructor(private readonly prisma: PrismaService) {}
```

---

## 5. RabbitMQ Setup

RabbitMQ will be used as the message broker between the microservices.

Official NestJS documentation:

[NestJS RabbitMQ Microservices](https://docs.nestjs.com/microservices/rabbitmq)

Install RabbitMQ locally, use Docker, or connect to a hosted RabbitMQ instance.

Add the RabbitMQ connection string to your `.env` file:

```env
RABBITMQ_URL="amqp://localhost:5672"
```

---

## 6. Configure a NestJS RabbitMQ Microservice

Open the microservice bootstrap file, usually:

```text
src/main.ts
```

Import the required NestJS microservices classes:

```ts
import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { AppModule } from "./app.module";
```

Then create the RabbitMQ microservice:

```ts
async function bootstrap() {
  const app =
    await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL as string],
        queue: "event_queue",
        queueOptions: {
          durable: true,
        },
      },
    });

  await app.listen();
}

bootstrap();
```

### Configuration Explanation

```ts
transport: Transport.RMQ
```

Tells NestJS to use **RabbitMQ** as the transport layer.

```ts
urls: [process.env.RABBITMQ_URL as string]
```

Defines the RabbitMQ server connection.

```ts
queue: "event_queue"
```

Defines the queue this service will listen to.

```ts
queueOptions: {
  durable: true,
}
```

A durable queue survives RabbitMQ server restarts.

---

## 7. Recommended Environment Variables

A basic `.env` file for the event service could look like this:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/somnogems"
RABBITMQ_URL="amqp://localhost:5672"
```

If RabbitMQ requires authentication:

```env
RABBITMQ_URL="amqp://username:password@localhost:5672"
```

---

## 8. Suggested Architecture

The services can communicate like this:

```text
Client
  |
  v
Gateway
  |
  +-------------------+
  |                   |
  v                   v
Auth Service      Event Service
                      |
                      v
                  RabbitMQ
                      |
                      v
             Notification Service
```

A typical responsibility split could be:

| Service | Responsibility |
| --- | --- |
| `gateway` | Receives client HTTP requests and routes work to services |
| `auth-service` | Handles login, authentication, users, and authorization |
| `event-service` | Handles event-related business logic |
| `notification-service` | Sends email, SMS, push, or other notifications |

---

## 9. Example Development Flow

A request may follow this sequence:

1. A client sends an HTTP request to the **Gateway**.
2. The Gateway validates and forwards the request.
3. The **Event Service** processes the event.
4. The Event Service stores data using **Prisma + PostgreSQL**.
5. The Event Service publishes a message to **RabbitMQ**.
6. The **Notification Service** consumes the message.
7. The Notification Service sends the required notification.

---

## 10. Next Steps

After completing the initial setup, students can continue by learning how to:

- Create RabbitMQ message patterns
- Use `ClientProxy` in NestJS
- Send events with `emit()`
- Send request-response messages with `send()`
- Create DTOs with validation
- Create Prisma models
- Run Prisma migrations
- Connect each service to its own database
- Add API Gateway communication
- Add authentication using JWT
- Add Docker and Docker Compose

---

## Useful Documentation

- [NestJS Documentation](https://docs.nestjs.com/)
- [NestJS Microservices](https://docs.nestjs.com/microservices/basics)
- [NestJS RabbitMQ](https://docs.nestjs.com/microservices/rabbitmq)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma with NestJS](https://www.prisma.io/docs/guides/v7/frameworks/nestjs)
- [RabbitMQ Documentation](https://www.rabbitmq.com/docs)

---

## Summary

At this stage, the project contains multiple NestJS applications and has the basic infrastructure required for a microservices architecture:

```text
NestJS
   +
Prisma
   +
PostgreSQL
   +
RabbitMQ
```

The next stage is to connect the services together and implement communication between the Gateway, Event Service, Auth Service, and Notification Service.
