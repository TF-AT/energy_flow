export interface Microgrid {
  id: string;
  name: string;
  location: string;
  capacity_kw: number;
  transformers?: Transformer[];
}

export interface Transformer {
  id: string;
  location: string;
  capacity_kw: number;
  microgridId: string;
  devices?: Device[];
  alerts?: Alert[];
}

export interface Device {
  id: string;
  type: string;
  status: "online" | "offline";
  lastSeen: string | Date;
  transformerId: string;
  readings?: EnergyReading[];
}

export interface EnergyReading {
  id: string;
  deviceId: string;
  voltage: number;
  current: number;
  frequency: number;
  timestamp: string | Date;
}

export interface Alert {
  id: string;
  transformerId: string;
  type: string;
  message: string;
  severity: string;
  isResolved: boolean;
  createdAt: string;
  transformer?: Transformer;
}

export interface DashboardData {
  transformersCount: number;
  activeAlertsCount: number;
  recentAlerts: Alert[];
  recentEvents: Alert[];
  recentReadings: EnergyReading[];
}
