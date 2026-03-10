import { Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import { AuthRequest } from "../middleware/auth.middleware";

export const getMicrogrids = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const microgrids = await prisma.site.findMany({
      where: { organizationId: req.user.organizationId },
      include: { transformers: true },
    });
    res.json(microgrids);
  } catch (error) {
    next(error);
  }
};

export const getTransformers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const transformers = await prisma.transformer.findMany({
      where: { site: { organizationId: req.user.organizationId } },
      include: { 
        devices: true,
      },
    });
    res.json(transformers);
  } catch (error) {
    next(error);
  }
};

export const getTransformerById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const transformer = await prisma.transformer.findUnique({
      where: { id },
      include: { 
        devices: true, 
        site: true,
      },
    });
    
    if (!transformer || transformer.site.organizationId !== req.user.organizationId) {
      return res.status(404).json({ error: "Transformer not found" });
    }
    
    res.json(transformer);
  } catch (error) {
    next(error);
  }
};

export const getAlerts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const alerts = await prisma.alert.findMany({
      where: { device: { site: { organizationId: req.user.organizationId } } },
      orderBy: { createdAt: "desc" },
      include: { device: true },
    });
    res.json(alerts);
  } catch (error) {
    next(error);
  }
};

export const getDashboardData = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const orgId = req.user.organizationId;

  try {
    const [transformersCount, activeAlerts, recentReadings, recentEvents, stats] = await Promise.all([
      prisma.transformer.count({ where: { site: { organizationId: orgId } } }),
      prisma.alert.findMany({
        where: { isResolved: false, device: { site: { organizationId: orgId } } },
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { device: true }
      }),
      prisma.energyReading.findMany({
        where: { device: { site: { organizationId: orgId } } },
        take: 500, // Reduced from 2000 for MVP efficiency
        orderBy: { timestamp: "desc" },
      }),
      prisma.alert.findMany({
        where: { device: { site: { organizationId: orgId } } },
        take: 20,
        orderBy: { createdAt: "desc" },
        include: { device: true }
      }),
      prisma.alert.count({
        where: { isResolved: false, device: { site: { organizationId: orgId } } }
      })
    ]);

    const dashboardData = {
      transformersCount,
      activeAlertsCount: stats,
      recentAlerts: activeAlerts,
      recentReadings,
      recentEvents,
    };

    res.json(dashboardData);
  } catch (error) {
    next(error);
  }
};
