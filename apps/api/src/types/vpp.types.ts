export interface NodeNetPowerUpdatedEvent {
  nodeId: string;
  microgridId: string;
  timestamp: number;
  netPowerKw: number;
  isSurplus: boolean;
}

export interface NodeEnergySurplusEvent {
  nodeId: string;
  microgridId: string;
  surplusKw: number;
  pricePreference: number;
  timestamp: number;
}

export interface NodeEnergyDeficitEvent {
  nodeId: string;
  microgridId: string;
  deficitKw: number;
  maxPrice: number;
  timestamp: number;
}

export interface StorageStateChangedEvent {
  storageId: string;
  nodeId: string;
  microgridId: string;
  socPercentage: number;
  availableCapacityKwh: number;
  timestamp: number;
}

export interface TradeExecutedEvent {
  tradeId: string;
  sellerNodeId: string;
  buyerNodeId: string;
  amountKw: number;
  price: number;
  microgridId: string;
  timestamp: number;
}

export interface MicrogridInstabilityEvent {
  microgridId: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  recommendedAction: string;
  timestamp: number;
}
