import { Response, NextFunction, Request } from "express";
import prisma from "../lib/prisma";
import { TelemetryService } from "../services/telemetry.service";
import { AuthRequest } from "../middleware/auth.middleware";

export const registerDevice = async (req: Request, res: Response, next: NextFunction) => {
  const { id, type, transformerId, siteId, token } = req.body;
  
  const expectedToken = process.env.REGISTRATION_TOKEN;
  if (expectedToken && token !== expectedToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!siteId) {
    return res.status(400).json({ error: "siteId is required" });
  }

  try {
    const device = await prisma.device.upsert({
      where: { id },
      update: { type, transformerId, siteId },
      create: { id, type, transformerId, siteId },
    });
    res.status(201).json(device);
  } catch (error) {
    next(error);
  }
};

export const createReading = async (req: Request, res: Response, next: NextFunction) => {
  const { deviceId, voltage: vRaw, current: cRaw, frequency: fRaw, timestamp } = req.body;
  
  const voltage = parseFloat(vRaw);
  const current = parseFloat(cRaw);
  const frequency = parseFloat(fRaw);

  try {
    TelemetryService.ingest({
      deviceId,
      deviceType: "transformer", // Legacy HTTP ingestion assumed to be transformer
      metrics: {
        voltage,
        load: current, // The new standard uses load instead of current
        frequency,
      },
      timestamp: timestamp ? new Date(timestamp).getTime() : Date.now(),
    });

    res.status(202).json({ message: "Telemetry accepted" });
  } catch (error: any) {
    if (error.message.includes("out of bounds")) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

export const getReadings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { deviceId, limit = 50 } = req.query;
  try {
    const readings = await prisma.energyReading.findMany({
      where: {
        ...(deviceId ? { deviceId: deviceId as string } : {}),
        device: { site: { organizationId: req.user.organizationId } }
      },
      take: parseInt(limit as string),
      orderBy: { timestamp: "desc" },
    });
    res.json(readings);
  } catch (error) {
    next(error);
  }
};
