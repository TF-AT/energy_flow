# Deployment Guide

This document outlines how to deploy EnergyFlow OS in a production or staging environment.

## 1. Prerequisites
*   **PostgreSQL 14+** (Must have the `timescaledb` extension installed)
*   **Node.js 20+**
*   **Docker & Docker Compose** (Optional, but recommended)
*   **PM2** (Process Manager for Node.js) or a container orchestrator (Kubernetes/ECS)

## 2. Environment Variables

Create `.env` files in both the API and Web roots by copying the examples.

### Backend (`apps/api/.env` and `packages/database/.env`)
```env
PORT=3001
FRONTEND_URL="https://dashboard.yourdomain.com"
JWT_SECRET="your_secure_random_string_here"
REGISTRATION_TOKEN="hardware_registration_secret_here"
DATABASE_URL="postgres://user:password@cloud-db-host:5432/energyflow?schema=public"
```

### Frontend (`apps/web/.env`)
```env
NEXT_PUBLIC_API_URL="https://api.yourdomain.com"
NEXT_PUBLIC_WS_URL="wss://api.yourdomain.com"
```

## 3. Database Initialization (TimescaleDB)

Before starting the application, the database must be migrated and seeded.

1.  If using Docker, start a Timescale-enabled Postgres container:
    ```bash
    docker run -d --name timescaledb -p 5432:5432 -e POSTGRES_PASSWORD=password timescale/timescaledb:latest-pg14
    ```
2.  Push the Prisma Schema:
    ```bash
    cd packages/database
    npx prisma migrate deploy
    ```
3.  Inject the TimescaleDB hypertable extension (Required for performance):
    Use `psql` or your database querying tool to execute the `migration.sql` file located in `packages/database/prisma/migrations/..._init_timescaledb`.
4.  Seed the initial organizational infrastructure:
    ```bash
    npm run seed
    ```

## 4. Building the Turborepo Workspace

From the root directory, install all Monorepo dependencies and build the packages:
```bash
npm install
npm run build
```

## 5. Starting the Services

### Start the Backend (API Server)
Use an orchestrator like PM2 to keep the Express and WebSocket services running.
```bash
npm install -g pm2
cd apps/api
pm2 start dist/index.js --name "energyflow-api"
```

### Start the Frontend (Next.js Dashboard)
```bash
cd apps/web
pm2 start npm --name "energyflow-web" -- start
```

## 6. Reverse Proxy Configuration (Nginx)

Route external traffic to your internal node process and ensure WebSocket upgrading is enabled.
```nginx
server {
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```
