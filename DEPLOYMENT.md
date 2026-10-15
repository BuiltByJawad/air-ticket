# Deployment Guide - Air Ticket Platform

This guide outlines the steps to deploy the Air Ticket Platform to a production environment.

## Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database
- Environment variables configured (see `.env.example`)

## Environment Variables

Ensure the following variables are set in your production environment:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `API_BASE_URL` | Base URL for the backend API |
| `APP_URL` | Base URL for the frontend application |
| `STRIPE_SECRET_KEY` | Stripe API key for payments |

## Deployment Steps

### 1. Backend API (NestJS)

```bash
# Navigate to api directory
cd apps/api

# Install dependencies
pnpm install

# Run database migrations
pnpm prisma migrate deploy

# Build the application
pnpm build

# Start the application
pnpm start:prod
```

### 2. Frontend (Next.js)

```bash
# Navigate to web directory
cd apps/web

# Install dependencies
pnpm install

# Build the application
pnpm build

# Start the application
pnpm start
```

## Production Hardening

- **Security**: Security headers are managed in `apps/web/middleware.ts`.
- **CSRF**: CSRF protection is enabled for all mutation server actions.
- **Monitoring**: Web Vitals are monitored via the `/api/web-vitals` sink.
- **Logging**: Structured JSON logging is implemented for backend services.

## Scaling

- The API is stateless and can be scaled horizontally.
- Use a Redis instance if session persistence across multiple instances is required (not currently implemented).
- Next.js can be deployed to Vercel or any containerized environment.
