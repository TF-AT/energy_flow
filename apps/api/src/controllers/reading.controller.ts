import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import { eventEmitter } from "./events.controller";

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
    if (idempotencyKey) {
      const existingReading = await prisma.energyReading.findUnique({
        where: { idempotencyKey }
      });
      if (existingReading) {
        return res.status(200).json({ reading: existingReading, idempotent: true });
      }
    }

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
        idempotencyKey,
      },
    });

    // Emit for real-time dashboard
    eventEmitter.emit("reading", reading);

    // Alert Detection
    const alertsToCreate = [];
    const normalTypes = [];

    if (voltage > 250) {
      alertsToCreate.push({ type: "OverVoltage", message: `OverVoltage: ${voltage}V` });
    } else if (voltage < 180) {
      alertsToCreate.push({ type: "UnderVoltage", message: `UnderVoltage: ${voltage}V` });
    } else {
      normalTypes.push("OverVoltage", "UnderVoltage");
    }
    
    if (frequency > 51 || frequency < 49) {
      alertsToCreate.push({ type: "GridInstability", message: `Frequency anomaly: ${frequency}Hz` });
    } else {
      normalTypes.push("GridInstability");
    }

    for (const alertData of alertsToCreate) {
      const existingAlert = await prisma.alert.findFirst({
        where: { transformerId: device.transformerId, type: alertData.type, isResolved: false }
      });

      if (!existingAlert) {
        const alert = await prisma.alert.create({
          data: { transformerId: device.transformerId, type: alertData.type, message: alertData.message },
        });
        eventEmitter.emit("alert", alert);
      }
    }

    if (normalTypes.length > 0) {
      await prisma.alert.updateMany({
        where: { transformerId: device.transformerId, type: { in: normalTypes }, isResolved: false },
        data: { isResolved: true }
      });
    }

    res.status(201).json(reading);
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
