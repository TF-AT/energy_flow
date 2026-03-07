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
