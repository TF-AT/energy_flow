# API Documentation

This document outlines the core REST endpoints required for interacting with the EnergyFlow OS backend.

## Base URL
`http://localhost:3001/api` (Development)

## Authentication
All endpoints (except login) require a standard JWT Bearer token or cookie-based authentication.
*   **Header:** `Authorization: Bearer <token>`
*   **Cookie:** `auth_token=<token>`

---

## 🔒 Authentication Boundaries

### `POST /auth/login`
Authenticates a user and issues a JWT token.
*   **Request Body:**
    ```json
    {
      "email": "admin@energyflow.com",
      "password": "securepassword"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "status": "success",
      "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI..."
      }
    }
    ```

---

## 📡 Telemetry & Dashboard

### `GET /microgrid/dashboard`
Fetches aggregated statistics and recent history required to populate the initial load of the operator dashboard.
*   **Response (200 OK):**
    ```json
    {
      "status": "success",
      "data": {
        "transformersCount": 4,
        "activeAlertsCount": 1,
        "recentAlerts": [...],
        "recentEvents": [...],
        "recentReadings": [...]
      }
    }
    ```

### `GET /microgrid/transformers`
Retrieves a list of all localized transformers and their current physical context.
*   **Response (200 OK):**
    ```json
    {
      "status": "success",
      "data": [
        {
          "id": "uuid-string",
          "location": "Substation Alpha",
          "capacity_kw": 500
        }
      ]
    }
    ```

---

## ⚙️ Configuration & Alerts

### `GET /alerts/rules`
Retrieves all dynamic threshold rules configured for the organization.
*   **Response (200 OK):**
    ```json
    {
      "status": "success",
      "data": [
        {
          "id": "uuid",
          "deviceType": "transformer",
          "metric": "voltage",
          "warningThreshold": 240,
          "criticalThreshold": 260,
          "condition": "GREATER_THAN"
        }
      ]
    }
    ```

### `POST /alerts/rules`
Creates a new dynamic alerting threshold.
*   **Request Body:**
    ```json
    {
      "deviceType": "transformer",
      "metric": "frequency",
      "warningThreshold": 49.5,
      "criticalThreshold": 49.0,
      "condition": "LESS_THAN"
    }
    ```
