import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { VppTopologyService } from "../services/vpp-topology.service";
import { SettlementService } from "../services/settlement.service";

export const createMicrogrid = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, region } = req.body;
    const result = await VppTopologyService.createMicrogrid({
      organizationId: req.user!.organizationId,
      name,
      region
    });
    res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
};

export const getMicrogrids = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const microgrids = await VppTopologyService.getMicrogrids(req.user!.organizationId);
    res.json({ status: "success", data: microgrids });
  } catch (error) {
    next(error);
  }
};

export const createNode = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { 
      microgridId, name, type, siteId, 
      hasSolar, hasBattery, hasEvCharger, 
      maxGenerationKw, baseLoadKw, batteryCapacityKwh 
    } = req.body;

    const node = await VppTopologyService.createNode({
      microgridId,
      name,
      type,
      siteId,
      hasSolar,
      hasBattery,
      hasEvCharger,
      maxGenerationKw,
      baseLoadKw,
      batteryCapacityKwh
    });
    res.json({ status: "success", data: node });
  } catch (error) {
    next(error);
  }
};

export const getNodeDetails = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const node = await VppTopologyService.getNode(id as string);
    if (!node) return res.status(404).json({ error: "Node not found" });
    res.json({ status: "success", data: node });
  } catch (error) {
    next(error);
  }
};

export const getSettlements = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { microgridId } = req.params;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default 30 days
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    
    const settlements = await SettlementService.calculateSettlement(microgridId as string, startDate, endDate);
    res.json({ status: "success", data: settlements });
  } catch (error) {
    next(error);
  }
};
