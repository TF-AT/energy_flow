import { create } from 'zustand';

export interface VppNodeState {
  nodeId: string;
  netPowerKw: number;
  isSurplus: boolean;
  timestamp: number;
}

export interface VppTrade {
  tradeId: string;
  sellerNodeId: string;
  buyerNodeId: string;
  kwTransferred: number;
  pricePerKw: number;
  totalCost: number;
  timestamp: string;
}

interface VppState {
  nodeStates: Record<string, VppNodeState>;
  recentTrades: VppTrade[];
  
  // Actions
  updateNodeState: (state: VppNodeState) => void;
  addTrade: (trade: VppTrade) => void;
}

export const useVppStore = create<VppState>()((set) => ({
  nodeStates: {},
  recentTrades: [],

  updateNodeState: (state: VppNodeState) => 
    set((prev) => ({
      nodeStates: {
        ...prev.nodeStates,
        [state.nodeId]: state
      }
    })),

  addTrade: (trade: VppTrade) => 
    set((prev) => ({
      recentTrades: [trade, ...prev.recentTrades].slice(0, 50) // Keep last 50 trades
    })),
}));
