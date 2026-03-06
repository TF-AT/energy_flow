# Energy Flow API

Express.js backend for the Energy Flow platform, handling microgrid data monitoring and power simulation.

## Features

- REST API for microgrids, transformers, and energy readings.
- Real-time energy simulation endpoints.
- Global error handling and request validation.
- Prisma integration for data persistence.

## Getting Started

### Prerequisites

- Root `npm install` completed.
- Database initialized (see `packages/database`).

### Environment Variables

Copy the example environment file and fill in your values:

```sh
cp .env.example .env
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | The port the API will listen on. | `3001` |
| `DATABASE_URL` | Prisma database connection string. | `file:../../packages/database/prisma/dev.db` |

### Running the API

```sh
# From the root
npx turbo dev --filter=api

# Or directly in this directory
npm run dev
```

## API Reference

### Health Check

- `GET /health`: Returns `{ "status": "ok" }`.

### Microgrids & Assets

- `GET /microgrids`: List all microgrids.
- `GET /transformers`: List all transformers.
- `GET /alerts`: List active system alerts.
- `GET /api/dashboard`: Get aggregated dashboard metrics.

### Energy Readings

- `GET /readings`: Get historical energy readings.
- `POST /readings`: Submit a new energy reading.
  - **Body**: `{ deviceId, voltage, current, frequency, timestamp }`
- `POST /devices/register`: Register a new IoT device to a transformer.
  - **Body**: `{ id, type, transformerId }`

## Simulation Scripts

You can simulate energy flow using the provided script:

```sh
npm run simulate
```
