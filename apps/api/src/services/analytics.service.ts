import prisma from "../lib/prisma";

export interface AnalyticsResult {
  timestamp: string;
  value: number;
}

export interface GridHealthResult {
  timestamp: string;
  voltageStability: number;
  frequencyStability: number;
}

export class AnalyticsService {
  /**
   * Aggregates solar power output over a time range.
   */
  static async getPowerOutput(organizationId: string, startTime: Date, endTime: Date, deviceId?: string) {
    const readings = await prisma.solarReading.findMany({
      where: {
        timestamp: { gte: startTime, lte: endTime },
        generator: { site: { organizationId } },
        ...(deviceId ? { solarGeneratorId: deviceId } : {}),
      },
      orderBy: { timestamp: "asc" },
    });

    return this.bucketReadings(readings, "power_kw");
  }

  /**
   * Aggregates load consumption over a time range.
   */
  static async getLoadConsumption(organizationId: string, startTime: Date, endTime: Date, deviceId?: string) {
    const readings = await prisma.loadReading.findMany({
      where: {
        timestamp: { gte: startTime, lte: endTime },
        load: { site: { organizationId } },
        ...(deviceId ? { energyLoadId: deviceId } : {}),
      },
      orderBy: { timestamp: "asc" },
    });

    return this.bucketReadings(readings, "consumption_kw");
  }

  /**
   * Aggregates battery charge patterns.
   */
  static async getBatteryTrends(organizationId: string, startTime: Date, endTime: Date, deviceId?: string) {
    const readings = await prisma.batteryReading.findMany({
      where: {
        timestamp: { gte: startTime, lte: endTime },
        battery: { site: { organizationId } },
        ...(deviceId ? { batteryStorageId: deviceId } : {}),
      },
      orderBy: { timestamp: "asc" },
    });

    return this.bucketReadings(readings, "soc_percentage");
  }

  /**
   * Calculates grid health metrics (stability).
   */
  static async getGridHealth(organizationId: string, startTime: Date, endTime: Date) {
    const readings = await prisma.energyReading.findMany({
      where: {
        timestamp: { gte: startTime, lte: endTime },
        device: { site: { organizationId } },
      },
      orderBy: { timestamp: "asc" },
    });

    // Bucket by hour and calculate variance/stability
    const buckets: Record<string, any[]> = {};
    readings.forEach((r) => {
      const hour = new Date(r.timestamp).toISOString().split(":")[0] + ":00:00.000Z";
      if (!buckets[hour]) buckets[hour] = [];
      buckets[hour].push(r);
    });

    return Object.entries(buckets).map(([timestamp, items]) => {
      const voltages = items.map((i) => i.voltage);
      const frequencies = items.map((i) => i.frequency);
      
      return {
        timestamp,
        voltageStability: 100 - (this.calculateStandardDeviation(voltages) * 10), // Heuristic
        frequencyStability: 100 - (this.calculateStandardDeviation(frequencies) * 100), // Heuristic
      };
    });
  }

  /**
   * Simple bucketing by hour for time-series charts.
   */
  private static bucketReadings(readings: any[], valueKey: string): AnalyticsResult[] {
    const buckets: Record<string, number[]> = {};
    
    readings.forEach((r) => {
      const hour = new Date(r.timestamp).toISOString().split(":")[0] + ":00:00.000Z";
      if (!buckets[hour]) buckets[hour] = [];
      buckets[hour].push(r[valueKey]);
    });

    return Object.entries(buckets).map(([timestamp, values]) => ({
      timestamp,
      value: values.reduce((a, b) => a + b, 0) / values.length,
    }));
  }

  private static calculateStandardDeviation(values: number[]) {
    if (values.length === 0) return 0;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map((v) => Math.pow(v - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
    return Math.sqrt(avgSquareDiff);
  }
}
