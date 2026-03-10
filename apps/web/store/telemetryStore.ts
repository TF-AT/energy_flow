import { create } from 'zustand';
import { TelemetryData, Alert, EnergyReading } from '../lib/types';

interface TelemetryState {
  telemetry: TelemetryData;
  newAlerts: Alert[];
  isConnected: boolean;
  liveReadings: EnergyReading[];
  
  // Actions
  processBatchedTelemetry: (events: any[]) => void;
  processBatchedAlerts: (events: Alert[]) => void;
  setIsConnected: (status: boolean) => void;
  clearAlerts: () => void;
}

const initialTelemetryData: TelemetryData = {
  transformers: [],
  solar: [],
  batteries: [],
  loads: [],
};

export const useTelemetryStore = create<TelemetryState>()((set) => ({
  telemetry: initialTelemetryData,
  newAlerts: [],
  isConnected: false,
  liveReadings: [],

  setIsConnected: (status: boolean) => set({ isConnected: status }),
  
  clearAlerts: () => set({ newAlerts: [] }),

  processBatchedAlerts: (events: Alert[]) => 
    set((state) => ({ newAlerts: [...events, ...state.newAlerts] })),

  processBatchedTelemetry: (events: any[]) => 
    set((state) => {
      // Shallow copy existing topology
      const nextTelemetry = {
        transformers: [...state.telemetry.transformers],
        solar: [...state.telemetry.solar],
        batteries: [...state.telemetry.batteries],
        loads: [...state.telemetry.loads],
      };
      
      events.forEach(eventData => {
        const categoryMap: Record<string, keyof TelemetryData> = {
          transformer: "transformers",
          solar: "solar",
          battery: "batteries",
          load: "loads"
        };

        const category = categoryMap[eventData.deviceType];
        if (category) {
          const updatedCategory = nextTelemetry[category];
          const index = updatedCategory.findIndex((d: any) => d.deviceId === eventData.deviceId || d.id === eventData.deviceId);
          
          const flattenedReading = {
            ...eventData.metrics,
            deviceId: eventData.deviceId,
            timestamp: eventData.timestamp
          };

          if (index !== -1) {
            updatedCategory[index] = flattenedReading;
          } else {
            updatedCategory.push(flattenedReading);
          }
        }
      });

      // Calculate Grid-wide Aggregation for UI 
      const transformers = nextTelemetry.transformers;
      let nextLiveReadings = state.liveReadings;

      if (transformers.length > 0) {
        const avgVoltage = transformers.reduce((sum: number, d: any) => sum + (d.voltage || 0), 0) / transformers.length;
        const avgFreq = transformers.reduce((sum: number, d: any) => sum + (d.frequency || 0), 0) / transformers.length;
        
        const newReading = {
          id: `agg-${Date.now()}`,
          timestamp: new Date().toISOString(),
          voltage: Number(avgVoltage.toFixed(2)),
          frequency: Number(avgFreq.toFixed(2)),
          current: 0,
          deviceId: "grid-average"
        } as EnergyReading;

        // Prevent duplicate timestamps in the same second
        if (!(state.liveReadings.length > 0 && state.liveReadings[0].timestamp === newReading.timestamp)) {
           nextLiveReadings = [newReading, ...state.liveReadings].slice(0, 300); // Keep up to 5 minutes of 1s live data
        }
      }

      return { 
        telemetry: nextTelemetry,
        liveReadings: nextLiveReadings
      };
    }),
}));
