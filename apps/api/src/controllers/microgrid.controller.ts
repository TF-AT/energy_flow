import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";

export const getMicrogrids = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const microgrids = await prisma.microgrid.findMany({
      include: { transformers: true },
    });
    res.json(microgrids);
  } catch (error) {
    next(error);
  }
};

export const getTransformers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transformers = await prisma.transformer.findMany({
      include: { 
        devices: true, 
        alerts: { where: { isResolved: false } } 
      },
    });
    res.json(transformers);
  } catch (error) {
    next(error);
  }
};

export const getAlerts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alerts = await prisma.alert.findMany({
      orderBy: { createdAt: "desc" },
      include: { transformer: true },
    });
    res.json(alerts);
  } catch (error) {
    next(error);
  }
};

// Simple in-memory cache
let dashboardCache: {
  data: any;
  timestamp: number;
} | null = null;

const CACHE_TTL = 30 * 1000; // 30 seconds

export const getDashboardData = async (req: Request, res: Response, next: NextFunction) => {
  const now = Date.now();
  
  if (dashboardCache && (now - dashboardCache.timestamp) < CACHE_TTL) {
    return res.json(dashboardCache.data);
  }

  try {
    const [transformersCount, activeAlerts, recentReadings] = await Promise.all([
      prisma.transformer.count(),
      prisma.alert.findMany({
        where: { isResolved: false },
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { transformer: true }
      }),
      prisma.energyReading.findMany({
        take: 2000,
        orderBy: { timestamp: "desc" },
      })
    ]);

    const dashboardData = {
      transformersCount,
      activeAlertsCount: activeAlerts.length,
      recentAlerts: activeAlerts,
      recentReadings,
    };

    // Update cache
    dashboardCache = {
      data: dashboardData,
      timestamp: now,
    };

    res.json(dashboardData);
  } catch (error) {
    next(error);
  }
};
