export interface EnergyReading {
  voltage: number;
  current: number;
  frequency: number;
  timestamp: string;
}

export enum AlertType {
  LOW_VOLTAGE = "LOW_VOLTAGE",
  HIGH_VOLTAGE = "HIGH_VOLTAGE",
  FREQUENCY_ABNORMAL = "FREQUENCY_ABNORMAL",
  OVERCURRENT = "OVERCURRENT"
}

export interface Alert {
  id: string;
  deviceId: string;
  type: AlertType;
  message: string;
  timestamp: string;
}

export const THRESHOLDS = {
  VOLTAGE_NOMINAL: 240,
  VOLTAGE_LOW: 216, // -10%
  VOLTAGE_HIGH: 264, // +10%
  FREQUENCY_NOMINAL: 50,
  FREQUENCY_MIN: 49.5,
  FREQUENCY_MAX: 50.5
};
