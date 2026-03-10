import prisma from "../lib/prisma";
import { TelemetryEvent, Metrics } from "../types/telemetry.types";
import { eventEmitter } from "../controllers/events.controller";

const CACHE_TTL_MS = 60000; // 1 minute cache

interface RuleCacheEntry {
  rules: any[];
  timestamp: number;
}

export class AlertRuleService {
  private static cache = new Map<string, RuleCacheEntry>();

  /**
   * Fetch rules for an organization with a fast in-memory cache to prevent DB spam on every telemetry event
   */
  static async getRulesForOrganization(organizationId: string) {
    const cached = this.cache.get(organizationId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.rules;
    }

    const rules = await prisma.alertRule.findMany({
      where: { organizationId }
    });

    this.cache.set(organizationId, {
      rules,
      timestamp: Date.now()
    });

    return rules;
  }

  /**
   * Force cache invalidation when rules are updated by an operator
   */
  static invalidateCache(organizationId: string) {
    this.cache.delete(organizationId);
  }

  /**
   * Evaluate telemetry metrics against dynamic alert rules
   */
  static async evaluate(event: TelemetryEvent, organizationId: string, deviceId: string) {
    const rules = await this.getRulesForOrganization(organizationId);
    
    // Filter rules relevant to this device type
    const applicableRules = rules.filter(r => r.deviceType === event.deviceType);
    if (applicableRules.length === 0) return;

    const metrics = event.metrics as Record<string, any>;
    const alertsToCreate: any[] = [];
    const normalRuleIds: string[] = [];

    for (const rule of applicableRules) {
      const value = metrics[rule.metric];
      if (value === undefined || value === null) continue;

      let triggeredSeverity = null;

      if (rule.condition === "GREATER_THAN") {
        if (rule.criticalThreshold !== null && value > rule.criticalThreshold) {
          triggeredSeverity = "CRITICAL";
        } else if (rule.warningThreshold !== null && value > rule.warningThreshold) {
          triggeredSeverity = "WARNING";
        }
      } else if (rule.condition === "LESS_THAN") {
        if (rule.criticalThreshold !== null && value < rule.criticalThreshold) {
          triggeredSeverity = "CRITICAL";
        } else if (rule.warningThreshold !== null && value < rule.warningThreshold) {
          triggeredSeverity = "WARNING";
        }
      }

      if (triggeredSeverity) {
        alertsToCreate.push({
          type: `Rule-${rule.metric}-${rule.condition}`,
          message: `${rule.metric} is ${value} (Threshold: ${triggeredSeverity === 'CRITICAL' ? rule.criticalThreshold : rule.warningThreshold})`,
          severity: triggeredSeverity,
          ruleId: rule.id // Track the rule that fired
        });
      } else {
        normalRuleIds.push(rule.id);
      }
    }

    for (const alertData of alertsToCreate) {
      const existingAlert = await prisma.alert.findFirst({
        where: { deviceId, type: alertData.type, isResolved: false }
      });

      if (!existingAlert) {
        const alert = await prisma.alert.create({
          data: {
            deviceId,
            type: alertData.type,
            message: alertData.message,
            severity: alertData.severity,
          },
        });
        
        eventEmitter.emit("alert", { ...alert, organizationId });
      }
    }

    if (normalRuleIds.length > 0) {
      const normalTypes = applicableRules
        .filter(r => normalRuleIds.includes(r.id))
        .map(r => `Rule-${r.metric}-${r.condition}`);

      if (normalTypes.length > 0) {
        await prisma.alert.updateMany({
          where: { deviceId, type: { in: normalTypes }, isResolved: false },
          data: { isResolved: true }
        });
      }
    }
  }
}
