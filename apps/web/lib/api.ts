import { DashboardData, Transformer, Alert, EnergyReading } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function fetcher<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  return response.json();
}

export const api = {
  getDashboardData: () => fetcher<DashboardData>("/api/dashboard"),
  getTransformers: () => fetcher<Transformer[]>("/transformers"),
  getAlerts: () => fetcher<Alert[]>("/alerts"),
  getReadings: (deviceId?: string, limit?: number) => 
    fetcher<EnergyReading[]>(`/readings?${deviceId ? `deviceId=${deviceId}` : ""}${limit ? `&limit=${limit}` : ""}`),
  getTransformerById: (id: string) => fetcher<Transformer>(`/transformers/${id}`),
};
