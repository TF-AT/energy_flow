"use client";

import React from "react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";
import { EnergyReading } from "../lib/types";

interface ChartProps {
  data: any[];
  dataKey: string;
  title: string;
  color: string;
  unit: string;
  domain?: [number | string, number | string];
}

export default function GenericMetricsChart({ data, dataKey, title, color, unit, domain }: ChartProps) {
  const chartData = [...data].reverse().map(r => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    [dataKey]: r[dataKey],
  }));

  return (
    <div className="bg-[#16161a] p-6 rounded-2xl border border-[#2d2d33] shadow-lg h-full">
      <h3 className="text-xs font-bold mb-6 text-[#64748b] uppercase tracking-widest">{title}</h3>
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2d33" vertical={false} />
            <XAxis dataKey="time" hide />
            <YAxis 
              domain={domain} 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(val) => `${val}${unit}`} 
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
            />
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color} 
              strokeWidth={2} 
              dot={false}
              animationDuration={300}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
