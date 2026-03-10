# Device Integration Guide

This guide is designed for hardware engineers, solar installers, and IoT developers who need to connect field devices (transformers, inverters, smart meters) to the EnergyFlow OS telemetry ingestion engine.

## 1. Authentication Configuration

Every device communicating with the platform must authenticate using an API key or an overarching registration token provided by the central command.

For simple deployments, set your device's script to utilize the environment registration token:
```bash
REGISTRATION_TOKEN="energy_secret_2026"
```

## 2. Device Registration (Provisioning)

Before a device can send telemetry, it must register its existence and physical type with the platform.

**Endpoint:** `POST /api/infrastructure/register`

**Payload structure:**
```json
{
  "type": "transformer", // or "solar", "battery", "load"
  "token": "energy_secret_2026"
}
```

**Response:**
Save the returned `deviceId`. You MUST use this ID for all subsequent telemetry messages.
```json
{
  "status": "success",
  "data": {
    "deviceId": "b4a1-89fc-..."
  }
}
```

## 3. Streaming Telemetry (WebSocket)

For high-frequency SCADA requirements (e.g., 1Hz to 10Hz reading rates), devices must use the WebSocket API. This bypasses HTTP overhead and prevents DDOSing the web server.

### Connecting
Open a standard WebSocket connection to the ingress URL, passing the raw authorization token in the query string.
`ws://<server-ip>:3001?token=<your-token>`

### Sending Data Payloads
Once connected, devices should stream stringified JSON objects conforming strictly to the following schema:

```json
{
  "type": "telemetry",
  "data": {
    "deviceId": "your-registered-device-id",
    "deviceType": "transformer",
    "timestamp": "2026-03-10T21:00:00Z",
    "metrics": {
      "voltage": 224.5,
      "current": 45.2,
      "frequency": 50.01
    }
  }
}
```

### Metrics Schema
The `metrics` object varies based on `deviceType`:
*   `transformer`: Requires `voltage`, `current`, `frequency`
*   `solar`: Requires `power_kw`, `efficiency`
*   `battery`: Requires `soc_percentage`, `temperature`, `charge_rate_kw`
*   `load`: Requires `consumption_kw`, `peak_demand_kw`

## 4. Hardware Client Example (Python/MicroPython)

If using a Raspberry Pi or ESP32 as an edge gateway:

```python
import websocket
import json
import time

WS_URL = "ws://api.energyflow.com:3001?token=energy_secret_2026"
DEVICE_ID = "node-alpha-001"

def on_open(ws):
    print("Edge gateway connected to EnergyFlow OS.")
    # Begin reading from serial port / modbus here
    while True:
        payload = {
            "type": "telemetry",
            "data": {
                "deviceId": DEVICE_ID,
                "deviceType": "transformer",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "metrics": {
                    "voltage": read_voltage_sensor(),
                    "frequency": read_frequency_sensor()
                }
            }
        }
        ws.send(json.dumps(payload))
        time.sleep(1) # Send at 1Hz

ws = websocket.WebSocketApp(WS_URL, on_open=on_open)
ws.run_forever()
```
