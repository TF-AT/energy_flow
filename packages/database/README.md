# Data Layer

Centralized database management for the Energy Flow project using Prisma and SQLite.

## Components

- `prisma/schema.prisma`: The source of truth for the database schema.
- `src/index.ts`: Shared Prisma Client instance.
- `src/seed.ts`: Script for seeding the database with initial data.

## Scripts

### Setup

1. **Generate Client**: Run this after any schema change to update the TypeScript types.
   ```sh
   npm run generate
   ```

2. **Push Schema**: Synchronize the SQLite database with your schema.
   ```sh
   npm run db:push
   ```

3. **Open Studio**: Visual database management.
   ```sh
   npm run studio
   ```

### Data Management

- **Seed Database**:
  ```sh
  npm run seed
  ```

## Schema Overview

- **Microgrid**: Represents an energy grid installation.
- **Transformer**: Power assets belonging to a microgrid.
- **Device**: IoT monitoring devices attached to transformers.
- **Reading**: Individual metrics (Voltage, Current, etc.) sent by devices.
- **Alert**: System-generated alerts based on abnormal readings.
