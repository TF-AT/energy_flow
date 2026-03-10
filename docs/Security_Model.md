# Security Model

This document outlines the security posture of EnergyFlow OS, designed to protect critical infrastructure telemetry and prevent unauthorized grid commands.

## 1. Authentication Layers

### 1.1 Human Operators (Dashboard Access)
Human users authenticate via the `/api/auth/login` endpoint using their email and bcrypt-hashed password.
*   **Tokens:** Upon success, a JSON Web Token (JWT) is issued.
*   **Storage:** The JWT is stored securely in an `HttpOnly` cookie or localStorage (depending on strict origin requirements).
*   **Validity:** Tokens must be rotated and expire every 24 hours.

### 1.2 IoT Device Provisioning (Hardware Access)
Hardware connects using a two-tiered security model to prevent spoofing:
1.  **Registration Level:** Devices use a highly restricted, globally rotated `REGISTRATION_TOKEN` to hit the `/register` endpoint.
2.  **Streaming Level:** Upon registration, the device is assigned a unique `deviceId`. The device must present this ID in every telemetry packet sent over the WebSocket. Future updates will transition this to individual hardware API Keys.

## 2. Multi-Tenancy Architecture
The database schema strictly adheres to a multi-tenant design:
*   Every `User`, `Site`, and `AlertRule` belongs to an `Organization`.
*   All backend API queries enforce organizational boundaries.
*   For example, `api.getDashboardData()` extracts the `organizationId` from the verified JWT and appends a `where: { organizationId }` clause to all Prisma queries.

## 3. Data Ingress Security (WebSockets)
*   **Upgrades:** WebSocket connections are not accepted unless a valid authorization token is present in the `?token=` query string during the initial HTTP Upgrade request.
*   **Payload Validation:** Every incoming binary or string payload is structurally validated against strict boundaries before being written to the TimescaleDB hypertable or broadcasted. Zod schemas evaluate metrics to prevent injection attacks.

## 4. Encryption
*   **Data in Transit:** All connections (Frontend UI, REST API, WebSocket) MUST run over TLS 1.3 (HTTPS/WSS) in production environments.
*   **Data at Rest:** By leveraging managed PostgreSQL/TimescaleDB instances, storage volumes are encrypted using AES-256 cloud provider keys (AWS KMS, Azure Key Vault).

## 5. Denial of Service (DoS) Prevention
To prevent a compromised hardware node from flooding the Event Bus:
*   The Telemetry ingest service will eventually integrate a Token Bucket rate-limiting algorithm per `deviceId`, capping ingestion at 20Hz.
*   Payloads larger than 10KB are immediately dropped by the WebSocket router.
