import { Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import { AuthRequest } from "../middleware/auth.middleware";
import { AlertRuleService } from "../services/alert-rule.service";

export const getAlertRules = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const rules = await prisma.alertRule.findMany({
      where: { organizationId: req.user.organizationId },
      orderBy: { createdAt: "desc" },
    });
    res.json(rules);
  } catch (error) {
    next(error);
  }
};

export const createAlertRule = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { deviceType, metric, warningThreshold, criticalThreshold, condition } = req.body;

    const rule = await prisma.alertRule.create({
      data: {
        organizationId: req.user.organizationId,
        deviceType,
        metric,
        warningThreshold: warningThreshold !== undefined ? Number(warningThreshold) : null,
        criticalThreshold: criticalThreshold !== undefined ? Number(criticalThreshold) : null,
        condition,
      },
    });

    // Invalidate the cache to ensure the rule takes effect immediately
    AlertRuleService.invalidateCache(req.user.organizationId);

    res.status(201).json(rule);
  } catch (error) {
    next(error);
  }
};

export const updateAlertRule = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { warningThreshold, criticalThreshold, condition } = req.body;

    // Verify ownership
    const existingRule = await prisma.alertRule.findUnique({ where: { id } });
    if (!existingRule || existingRule.organizationId !== req.user.organizationId) {
      return res.status(404).json({ error: "Alert Rule not found" });
    }

    const rule = await prisma.alertRule.update({
      where: { id },
      data: {
        warningThreshold: warningThreshold !== undefined ? Number(warningThreshold) : null,
        criticalThreshold: criticalThreshold !== undefined ? Number(criticalThreshold) : null,
        condition,
      },
    });

    AlertRuleService.invalidateCache(req.user.organizationId);

    res.json(rule);
  } catch (error) {
    next(error);
  }
};

export const deleteAlertRule = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const existingRule = await prisma.alertRule.findUnique({ where: { id } });
    if (!existingRule || existingRule.organizationId !== req.user.organizationId) {
      return res.status(404).json({ error: "Alert Rule not found" });
    }

    await prisma.alertRule.delete({ where: { id } });

    AlertRuleService.invalidateCache(req.user.organizationId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
