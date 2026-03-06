import React from "react";
import { Server, AlertTriangle, Zap, Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatsProps {
  transformersCount: number;
  activeAlertsCount: number;
  currentVoltage: number;
  currentFrequency: number;
  prevVoltage?: number;
  prevFrequency?: number;
}

export default function DashboardStats({ 
  transformersCount, 
  activeAlertsCount, 
  currentVoltage, 
  currentFrequency,
  prevVoltage,
  prevFrequency
}: StatsProps) {
  
  const voltageStatus = currentVoltage > 250 || currentVoltage < 180 ? 'critical' : currentVoltage > 240 || currentVoltage < 195 ? 'warning' : 'normal';
  const frequencyStatus = currentFrequency > 51.5 || currentFrequency < 48.5 ? 'critical' : currentFrequency > 50.5 || currentFrequency < 49.5 ? 'warning' : 'normal';

  const getTrend = (curr: number, prev?: number) => {
    if (!prev || curr === prev) return <Minus size={12} className="text-text-muted" />;
    return curr > prev ? <TrendingUp size={12} className="text-success" /> : <TrendingDown size={12} className="text-critical" />;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard 
        label="Operational Assets" 
        value={transformersCount.toString()} 
        icon={<Server size={18} />} 
        status="normal"
      />
      <StatCard 
        label="Critical Alerts" 
        value={activeAlertsCount.toString()} 
        icon={<AlertTriangle size={18} />} 
        status={activeAlertsCount > 0 ? "critical" : "normal"}
        isCritical={activeAlertsCount > 0}
      />
      <StatCard 
        label="Grid Voltage (V)" 
        value={currentVoltage.toFixed(1)} 
        icon={<Zap size={18} />} 
        status={voltageStatus}
        trend={getTrend(currentVoltage, prevVoltage)}
      />
      <StatCard 
        label="Grid Frequency (Hz)" 
        value={currentFrequency.toFixed(2)} 
        icon={<Activity size={18} />} 
        status={frequencyStatus}
        trend={getTrend(currentFrequency, prevFrequency)}
      />
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  icon, 
  status,
  isCritical,
  trend
}: { 
  label: string; 
  value: string; 
  icon: React.ReactNode; 
  status: 'normal' | 'warning' | 'critical';
  isCritical?: boolean;
  trend?: React.ReactNode;
}) {
  const statusColors = {
    normal: "text-success border-success/20 bg-success/[0.02]",
    warning: "text-warning border-warning/20 bg-warning/[0.02]",
    critical: "text-critical border-critical/20 bg-critical/[0.02]",
  };

  return (
    <div className={`pro-card p-6 border-b-2 ${status === 'critical' ? 'border-b-rose-500' : status === 'warning' ? 'border-b-amber-500' : 'border-b-transparent'}`}>
      <div className="flex justify-between items-center mb-4">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">{label}</span>
        <div className={`p-2 rounded-lg bg-card-bg border border-card-border ${isCritical ? 'text-critical' : 'text-text-secondary'}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-2">
           <span className={`text-5xl font-black tracking-tighter leading-none font-mono ${isCritical ? 'text-critical animate-pulse' : 'text-text-primary'}`}>
             {value}
           </span>
           {trend && <div className="mb-1">{trend}</div>}
        </div>
        <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${statusColors[status]}`}>
           {status}
        </div>
      </div>
    </div>
  );
}
