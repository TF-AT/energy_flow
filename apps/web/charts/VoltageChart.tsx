"use client";

import React from "react";
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine, ReferenceArea
} from "recharts";
import { EnergyReading } from "../lib/types";

interface ChartProps {
  data: EnergyReading[];
  title?: string;
  height?: number;
  isLive?: boolean;
}

export default function VoltageChart({ data, title = "Phase Voltage Diagnostics", height = 400, isLive = false }: ChartProps) {
  const chartData = [...data].reverse().map(r => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    voltage: r.voltage,
  }));

  return (
    <div className="pro-card p-8 h-full">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">{title}</h3>
          <p className="text-[9px] text-text-secondary font-bold mt-1 uppercase tracking-widest">Decision-Support Visualization</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-critical/30" />
            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Critical Zones</span>
          </div>
          <div className="h-4 w-px bg-card-border" />
          <div className="flex items-center gap-2">
             <span className={`h-2 w-2 rounded-full ${isLive ? 'bg-success animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-text-muted'}`} />
             <span className={`text-[10px] font-black uppercase tracking-widest ${isLive ? 'text-success' : 'text-text-muted'}`}>
                {isLive ? 'Live Stream Active' : 'Polling'}
             </span>
          </div>
        </div>
      </div>

      <div style={{ width: '100%', height: height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="voltageGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-info)" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="var(--color-info)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-card-border)" />
            <XAxis 
              dataKey="time" 
              stroke="var(--color-text-muted)" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              minTickGap={80}
              fontFamily="JetBrains Mono"
            />
            <YAxis 
              domain={[140, 300]} 
              stroke="var(--color-text-muted)" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(val) => `${val}V`} 
              fontFamily="JetBrains Mono"
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', borderRadius: '4px', color: 'var(--color-text-primary)', fontSize: '10px', fontFamily: 'JetBrains Mono' }}
              itemStyle={{ color: 'var(--color-info)', fontWeight: 700 }}
              cursor={{ stroke: 'var(--color-info)', strokeWidth: 1 }}
            />
            
            {/* Danger Zones */}
            <ReferenceArea y1={260} y2={300} fill="var(--color-critical)" fillOpacity={0.05} />
            <ReferenceArea y1={140} y2={185} fill="var(--color-critical)" fillOpacity={0.05} />
            
            <ReferenceLine y={240} stroke="var(--color-success)" strokeDasharray="3 3" strokeWidth={1} opacity={0.5} />
            <ReferenceLine y={260} stroke="var(--color-critical)" strokeWidth={1} opacity={0.8} />
            <ReferenceLine y={185} stroke="var(--color-critical)" strokeWidth={1} opacity={0.8} />
            
            <Area 
              type="stepAfter" 
              dataKey="voltage" 
              stroke="var(--color-info)" 
              strokeWidth={2} 
              fillOpacity={1} 
              fill="url(#voltageGradient)"
              isAnimationActive={true}
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
