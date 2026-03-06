import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";

export const registerDevice = async (req: Request, res: Response, next: NextFunction) => {
  const { id, type, transformerId, token } = req.body;
  
  // Basic security: Check for registration token
  const expectedToken = process.env.REGISTRATION_TOKEN;
  if (expectedToken && token !== expectedToken) {
    return res.status(401).json({ error: "Unauthorized: Invalid or missing registration token" });
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
  const { deviceId, voltage: vRaw, current: cRaw, frequency: fRaw, timestamp } = req.body;
  
  const voltage = parseFloat(vRaw);
  const current = parseFloat(cRaw);
  const frequency = parseFloat(fRaw);

  try {
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      include: { transformer: true },
    });

    if (!device) {
      return res.status(404).json({ error: "Device not found" });
    }

    const reading = await prisma.energyReading.create({
      data: {
        deviceId,
        voltage,
        current,
        frequency,
        timestamp: new Date(timestamp),
      },
    });

    // Alert Detection Logic
    const alertsToCreate = [];
    const normalTypes = []; // To resolve if back to normal

    if (voltage > 250) {
      alertsToCreate.push({ type: "OverVoltage", message: `Critical OverVoltage: ${voltage}V detected on device ${deviceId}` });
    } else if (voltage < 180) {
      alertsToCreate.push({ type: "UnderVoltage", message: `Critical UnderVoltage: ${voltage}V detected on device ${deviceId}` });
    } else {
      normalTypes.push("OverVoltage", "UnderVoltage");
    }
    
    if (frequency > 51 || frequency < 49) {
      alertsToCreate.push({ type: "GridInstability", message: `Frequency anomaly: ${frequency}Hz detected on device ${deviceId}` });
    } else {
      normalTypes.push("GridInstability");
    }

    // 1. Alert Deduplication: Only create if no active alert of same type for this transformer
    for (const alertData of alertsToCreate) {
      const existingAlert = await prisma.alert.findFirst({
        where: {
          transformerId: device.transformerId,
          type: alertData.type,
          isResolved: false
        }
      });

      if (!existingAlert) {
        await prisma.alert.create({
          data: {
            transformerId: device.transformerId,
            type: alertData.type,
            message: alertData.message,
          },
        });
      }
    }

    // 2. Auto-Resolution: Resolve active alerts if readings are back to normal
    if (normalTypes.length > 0) {
      await prisma.alert.updateMany({
        where: {
          transformerId: device.transformerId,
          type: { in: normalTypes },
          isResolved: false
        },
        data: { isResolved: true }
      });
    }

    res.status(201).json({ reading, alertsProcessed: alertsToCreate.length });
  } catch (error) {
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
