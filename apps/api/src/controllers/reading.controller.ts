import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import { ReadingService } from "../services/reading.service";

export const registerDevice = async (req: Request, res: Response, next: NextFunction) => {
  const { id, type, transformerId, token } = req.body;
  
  const expectedToken = process.env.REGISTRATION_TOKEN;
  if (expectedToken && token !== expectedToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const device = await prisma.device.upsert({
      where: { id },
      update: { type, transformerId },
      create: { id, type, transformerId },
    });
    res.status(201).json(device);
  } catch (error) {
    next(error);
  }
};

export const createReading = async (req: Request, res: Response, next: NextFunction) => {
  const { deviceId, voltage: vRaw, current: cRaw, frequency: fRaw, timestamp, idempotencyKey } = req.body;
  
  const voltage = parseFloat(vRaw);
  const current = parseFloat(cRaw);
  const frequency = parseFloat(fRaw);

  try {
    const reading = await ReadingService.processReading({
      deviceId,
      voltage,
      current,
      frequency,
      timestamp: new Date(timestamp),
      idempotencyKey,
    });

    res.status(201).json(reading);
  } catch (error: any) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

export const getReadings = async (req: Request, res: Response, next: NextFunction) => {
  const { deviceId, limit = 50 } = req.query;
  try {
    const readings = await prisma.energyReading.findMany({
      where: deviceId ? { deviceId: deviceId as string } : {},
      take: parseInt(limit as string),
      orderBy: { timestamp: "desc" },
    });
    res.json(readings);
  } catch (error) {
    next(error);
  }
};
