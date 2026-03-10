"use client";

import React from "react";
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area
} from "recharts";

interface HistoryChartProps {
  data: { timestamp: string; value: number }[];
  title: string;
  subtitle: string;
  valueSuffix?: string;
  color?: string;
  height?: number;
  domain?: [number | string, number | string];
}

export default function HistoryChart({ 
  data, 
  title, 
  subtitle, 
  valueSuffix = "", 
  color = "#3b82f6", 
  height = 300,
  domain = ["auto", "auto"]
}: HistoryChartProps) {
  const chartData = data.map(r => ({
    time: new Date(r.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit' }),
    value: Number(r.value.toFixed(2)),
  }));

  return (
    <div className="pro-card p-6 h-full border border-[#2d2d33] bg-[#111114] rounded-2xl">
      <div className="mb-6">
        <h3 className="text-[10px] font-black text-[#64748b] uppercase tracking-[0.3em]">{title}</h3>
        <p className="text-[9px] text-[#475569] font-bold mt-1 uppercase tracking-widest">{subtitle}</p>
      </div>

      <div style={{ width: '100%', height: height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id={`gradient-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.1}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2d2d33" />
            <XAxis 
              dataKey="time" 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              minTickGap={60}
              fontFamily="monospace"
            />
            <YAxis 
              domain={domain}
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(val) => `${val}${valueSuffix}`} 
              fontFamily="monospace"
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#111114', border: '1px solid #2d2d33', borderRadius: '8px', fontSize: '10px', fontFamily: 'monospace' }}
              itemStyle={{ color: color, fontWeight: 700 }}
              cursor={{ stroke: color, strokeWidth: 1 }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              strokeWidth={2} 
              fillOpacity={1} 
              fill={`url(#gradient-${title.replace(/\s+/g, '')})`}
              isAnimationActive={true}
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
