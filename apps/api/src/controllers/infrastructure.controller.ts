import { Response, NextFunction, Request } from "express";
import prisma from "../lib/prisma";
import { DeviceGateway } from "../services/gateway.service";
import { AuthRequest } from "../middleware/auth.middleware";

// IoT / Device Ingestion
export const handleDevicePush = async (req: Request, res: Response, next: NextFunction) => {
  const { deviceId } = req.params;
  const payload = req.body;
  const authHeader = req.headers.authorization;

  if (!deviceId) return res.status(400).json({ error: "Device ID is required" });

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn(`[SECURITY] Rejected telemetry from ${deviceId}: Missing or invalid Authorization header.`);
    return res.status(401).json({ error: "Unauthorized: Missing API Key" });
  }

  const apiKey = authHeader.split(" ")[1];

  try {
    const device = await prisma.device.findUnique({
      where: { id: deviceId, apiKey }
    });

    if (!device) {
      console.warn(`[SECURITY] Rejected telemetry from ${deviceId}: Invalid API Key or Device not found.`);
      return res.status(401).json({ error: "Unauthorized: Invalid API Key" });
    }

    DeviceGateway.handleWebhookPush(deviceId, payload);
    res.status(202).json({ status: "accepted", timestamp: new Date() });
  } catch (error) {
    next(error);
  }
};

// Solar Generators
export const getSolarGenerators = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const generators = await prisma.solarGenerator.findMany({
      where: { site: { organizationId: req.user.organizationId } },
      include: { readings: { take: 1, orderBy: { timestamp: "desc" } } },
    });
    res.json(generators);
  } catch (error) {
    next(error);
  }
};

export const getSolarGeneratorById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const generator = await prisma.solarGenerator.findUnique({
      where: { id },
      include: { readings: { take: 50, orderBy: { timestamp: "desc" } }, site: true },
    });
    if (!generator || generator.site.organizationId !== req.user.organizationId) {
      return res.status(404).json({ error: "Solar Generator not found" });
    }
    res.json(generator);
  } catch (error) {
    next(error);
  }
};

// Battery Storage
export const getBatteries = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const batteries = await prisma.batteryStorage.findMany({
      where: { site: { organizationId: req.user.organizationId } },
      include: { readings: { take: 1, orderBy: { timestamp: "desc" } } },
    });
    res.json(batteries);
  } catch (error) {
    next(error);
  }
};

export const getBatteryById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const battery = await prisma.batteryStorage.findUnique({
      where: { id },
      include: { readings: { take: 50, orderBy: { timestamp: "desc" } }, site: true },
    });
    if (!battery || battery.site.organizationId !== req.user.organizationId) {
      return res.status(404).json({ error: "Battery not found" });
    }
    res.json(battery);
  } catch (error) {
    next(error);
  }
};

// Energy Loads
export const getLoads = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const loads = await prisma.energyLoad.findMany({
      where: { site: { organizationId: req.user.organizationId } },
      include: { readings: { take: 1, orderBy: { timestamp: "desc" } } },
    });
    res.json(loads);
  } catch (error) {
    next(error);
  }
};

export const getLoadById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const load = await prisma.energyLoad.findUnique({
      where: { id },
      include: { readings: { take: 50, orderBy: { timestamp: "desc" } }, site: true },
    });
    if (!load || load.site.organizationId !== req.user.organizationId) {
      return res.status(404).json({ error: "Load not found" });
    }
    res.json(load);
  } catch (error) {
    next(error);
  }
};
