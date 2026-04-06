# User Authentication and Billing System

Secure, modular NestJS backend for authentication, RBAC, billing accounts, and locked fund transfers. The project follows SOLID principles, uses TypeORM migrations, stores JWT access and refresh tokens in HTTP-only cookies, and exposes OpenAPI documentation through Swagger.

## Features

- NestJS modular architecture with separation across auth, users, accounts, transactions, roles, and webhooks
- PostgreSQL persistence with TypeORM entities, explicit migrations, and `synchronize: false`
- JWT access and refresh tokens delivered through HTTP-only cookies
- Global `RolesGuard`, `AccessTokenGuard`, and `ActiveUserGuard`
- Pessimistic row locking for transfers to prevent concurrent balance corruption
- Reusable pagination DTO for transaction listing
- Async webhook delivery after completed transfers
- Bootstrap seeding for default roles and an admin user
- Swagger/OpenAPI 3.0 docs with decorated DTOs
- Docker multi-stage image and `docker-compose` orchestration

## Project Structure

```text
src
├── app.module.ts
├── common
│   ├── constants
│   ├── decorators
│   ├── dto
│   ├── filters
│   ├── guards
│   ├── interfaces
│   └── utils
├── config
├── infrastructure
│   └── database
│       ├── migrations
│       └── seed
└── modules
    ├── accounts
    ├── auth
    ├── roles
    ├── transactions
    ├── users
    └── webhooks
```

## Setup

1. Create environment variables.

```bash
cp .env.example .env
```

2. Install dependencies.

```bash
npm install
```

3. Run migrations.

```bash
npm run migration:run
```

4. Start the app in development mode.

```bash
npm run start:dev
```

5. Open Swagger.

```text
http://localhost/docs
```

## Docker

1. Prepare the environment file.

```bash
cp .env.example .env
```

2. Build and start the stack.

```bash
docker compose up --build
```

The app container runs compiled migrations on startup before launching the API.
This behavior is controlled by `AUTO_RUN_MIGRATIONS=true`.

With the reverse proxy enabled in `docker-compose.yml`, the API is available through nginx at:

```text
http://localhost
```

Swagger is available at:

```text
http://localhost/docs
```

Using nginx as a reverse proxy keeps the public entry point stable and aligns the stack with common scalability and security practices.

## Useful Commands

```bash
npm run build
npm run lint
npm run lint:fix
npm run format
npm run format:check
npm run migration:create
npm run migration:generate
npm run migration:run
npm run migration:revert
npm run seed
```

## Default Seed Data

- Roles: `Admin`, `Client`
- Admin email: `admin@example.com`
- Admin password: `Admin12345!`
- Admin initial balance: `1000.00`

Override these values in `.env` for real environments.

## API Overview

- `POST /api/auth/register` registers a client user and creates a billing account
- `POST /api/auth/login` issues access and refresh cookies
- `POST /api/auth/refresh` rotates the cookie pair using the refresh token
- `POST /api/auth/logout` clears auth cookies
- `GET /api/users/me` returns the current user
- `PATCH /api/users/:id/active` allows admins to activate or deactivate a user
- `GET /api/accounts/me` returns the authenticated user's billing account
- `POST /api/transactions/transfer` transfers funds with pessimistic locking
- `GET /api/transactions` returns paginated transactions for admins

## Transfer Safety

Transfers are implemented with:

- a persisted pending transaction row
- a database transaction on the balance update path
- deterministic account locking order
- `pessimistic_write` locks on both account rows
- rollback on failure plus status transition to `Canceled`

Balances are stored as `bigint` minor units in PostgreSQL and exposed as two-decimal strings in API responses to avoid floating-point errors.
