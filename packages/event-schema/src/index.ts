import { z } from "zod";

// Base Event Data
export const BaseEventSchema = z.object({
  id: z.string().uuid().optional(),
  timestamp: z.string().datetime().optional().default(() => new Date().toISOString()),
});

// Generation Event
export const GenerationEventSchema = BaseEventSchema.extend({
  nodeId: z.string().uuid(),
  source: z.enum(["SOLAR", "WIND", "BATTERY_DISCHARGE", "GENERATOR"]),
  kwProduced: z.number().nonnegative(),
});
export type GenerationEvent = z.infer<typeof GenerationEventSchema>;

// Consumption Event
export const ConsumptionEventSchema = BaseEventSchema.extend({
  nodeId: z.string().uuid(),
  kwConsumed: z.number().nonnegative(),
});
export type ConsumptionEvent = z.infer<typeof ConsumptionEventSchema>;

// Routing Node Event (Net Power Calculation)
export const RoutingNodeStateSchema = z.object({
  nodeId: z.string().uuid(),
  generationKw: z.number().nonnegative(),
  consumptionKw: z.number().nonnegative(),
  netKw: z.number(), // + = Surplus, - = Deficit
});
export type RoutingNodeState = z.infer<typeof RoutingNodeStateSchema>;

// Trade Executed Event
export const TradeExecutedEventSchema = BaseEventSchema.extend({
  tradeId: z.string().uuid(),
  microgridId: z.string().uuid(),
  sellerNodeId: z.string().uuid(),
  buyerNodeId: z.string().uuid(),
  kwTransferred: z.number().positive(),
  pricePerKw: z.number().nonnegative(),
  totalCost: z.number().nonnegative(),
});
export type TradeExecutedEvent = z.infer<typeof TradeExecutedEventSchema>;

// Telemetry Batch Event (For Simulator to Push)
export const TelemetryBatchEventSchema = z.object({
  batchId: z.string().uuid().optional(),
  microgridId: z.string().uuid(),
  timestamp: z.string().datetime(),
  generation: z.array(GenerationEventSchema),
  consumption: z.array(ConsumptionEventSchema),
});
export type TelemetryBatchEvent = z.infer<typeof TelemetryBatchEventSchema>;
