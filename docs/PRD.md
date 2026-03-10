# Product Requirements Document (PRD)

## 1. Product Vision
**EnergyFlow OS** is an intelligent, real-time situational awareness and grid stabilization platform designed specifically for distributed energy systems, microgrids, and emerging utility networks. The vision is to empower grid operators with military-grade, real-time observability of their transformers, solar generators, battery storage units, and large loads down to the sub-second level.

## 2. Target Users
1. **Grid Operators/Dispatchers:** The primary users. They sit in control rooms and use the dashboard to monitor live grid health, respond to critical alerts (e.g., voltage spikes, frequency drops), and make fast load-shedding or stabilization decisions.
2. **Field Engineers/Solar Installers:** Use the platform to register new hardware (like inverters or smart meters), troubleshoot individual device telemetry, and verify that installations are communicating correctly with the command center.
3. **Utility Managers/Stakeholders:** Review aggregated data, system health scores, and historical incident timelines to make infrastructure investment decisions.

## 3. Problem Statement
Distributed energy resources (DERs) like solar and batteries are creating highly volatile grid environments. Traditional SCADA (Supervisory Control and Data Acquisition) systems are often:
*   Too slow (polling data every 5-15 minutes).
*   Too rigid (hard to integrate modern IoT protocols like websockets or MQTT).
*   Too visually complex for rapid decision making.
This leads to undetected voltage anomalies, delayed response times to critical failures, and ultimately, grid blackouts.

## 4. Proposed Solution
EnergyFlow OS bridges the gap by providing a modern web-based SCADA alternative. It leverages:
*   **High-Frequency Telemetry:** Ingesting data at 10Hz/1Hz intervals for true real-time visibility.
*   **Intelligent Aggregation:** Filtering out noise and calculating true grid health scores instantly.
*   **Dynamic Alerting:** Evaluating real-time data against configurable thresholds to instantly notify operators of critical out-of-bounds metrics.

## 5. Core Features (MVP)
1. **Real-time Oscilloscope Dashboard:** A high-performance chart plotting aggregated grid voltage and frequency live via WebSockets.
2. **Dynamic Alerting Engine:** A rules-based engine that evaluates every incoming telemetry packet against user-defined tolerances (e.g., "Alert if Voltage > 260V").
3. **Situational Awareness UI:** A master status header ("The 3-Second Rule" UI) that instantly turns green, yellow, or red based on live grid conditions, giving operators immediate context.
4. **Device Registry & Fleet Management:** An API backend to track transformers, batteries, and solar units across multiple physical sites.

## 6. Key Use Cases
*   **Use Case 1 (Anomaly Detection):** A physical transformer starts overheating, causing erratic voltage. EnergyFlow OS instantly detects the anomaly via the 1Hz stream, triggers a "CRITICAL" alert, and turns the dashboard red, prompting the operator to dispatch a field team before a blowout occurs.
*   **Use Case 2 (Hardware Integration):** A solar installer finishes connecting a new array. They hit the `/api/infrastructure/register` endpoint using their API key, and the array immediately begins streaming power generation data to the live dashboard.
