import { Alert, EnergyReading } from "./types";
import { GridStatus } from "../components/Layout";

export function calculateGridStatus(
  activeAlertsCount: number,
  recentReadings: EnergyReading[],
  recentAlerts: Alert[] = []
): GridStatus {
  const currentReading = recentReadings[0];
  const voltage = currentReading?.voltage ?? 0;

  const isCritical = activeAlertsCount > 0 || (voltage > 260 || (voltage > 0 && voltage < 185));
  const isWarning = !isCritical && (recentAlerts.length > 0 || (voltage > 240 || (voltage > 0 && voltage < 195)));

  if (isCritical) return "critical";
  if (isWarning) return "warning";
  return "nominal";
}

export function calculateHealthScore(
  activeAlerts: Alert[],
  recentReadings: EnergyReading[]
): number {
  let score = 100;

  // 1. Deduct for Alerts
  activeAlerts.forEach(alert => {
    if (alert.type === "COMMUNICATION_LOST" || alert.type === "OverVoltage" || alert.type === "UnderVoltage") {
      score -= 15; // Critical issues
    } else {
      score -= 5;  // Warnings
    }
  });

  // 2. Deduct for Voltage Instability (Target 230V)
  const currentReading = recentReadings[0];
  if (currentReading) {
    const voltageDev = Math.abs(currentReading.voltage - 230);
    if (voltageDev > 10) {
      score -= Math.min(20, (voltageDev - 10) * 0.5);
    }

    // 3. Deduct for Frequency Instability (Target 50Hz)
    const freqDev = Math.abs(currentReading.frequency - 50);
    if (freqDev > 0.1) {
      score -= Math.min(15, (freqDev - 0.1) * 20);
    }
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}
