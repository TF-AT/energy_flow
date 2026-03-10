import { Response, NextFunction } from "express";
import { AnalyticsService } from "../services/analytics.service";
import { AuthRequest } from "../middleware/auth.middleware";

export const getPowerOutputAnalytics = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startTime, endTime, deviceId } = req.query;
    const start = startTime ? new Date(startTime as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const end = endTime ? new Date(endTime as string) : new Date();

    const data = await AnalyticsService.getPowerOutput(req.user.organizationId, start, end, deviceId as string);
    res.json({ status: "success", data });
  } catch (error) {
    next(error);
  }
};

export const getLoadConsumptionAnalytics = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startTime, endTime, deviceId } = req.query;
    const start = startTime ? new Date(startTime as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const end = endTime ? new Date(endTime as string) : new Date();

    const data = await AnalyticsService.getLoadConsumption(req.user.organizationId, start, end, deviceId as string);
    res.json({ status: "success", data });
  } catch (error) {
    next(error);
  }
};

export const getBatteryAnalytics = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startTime, endTime, deviceId } = req.query;
    const start = startTime ? new Date(startTime as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const end = endTime ? new Date(endTime as string) : new Date();

    const data = await AnalyticsService.getBatteryTrends(req.user.organizationId, start, end, deviceId as string);
    res.json({ status: "success", data });
  } catch (error) {
    next(error);
  }
};

export const getGridHealthAnalytics = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startTime, endTime } = req.query;
    const start = startTime ? new Date(startTime as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const end = endTime ? new Date(endTime as string) : new Date();

    const data = await AnalyticsService.getGridHealth(req.user.organizationId, start, end);
    res.json({ status: "success", data });
  } catch (error) {
    next(error);
  }
};
