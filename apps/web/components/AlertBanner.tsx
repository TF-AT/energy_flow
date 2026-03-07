import React from "react";
import { AlertCircle, CheckCircle2, Clock, MapPin } from "lucide-react";
import { Alert } from "../lib/types";

interface AlertBannerProps {
  latestAlert: Alert | null;
  activeAlertsCount: number;
}

export default function AlertBanner({ latestAlert, activeAlertsCount }: AlertBannerProps) {
  if (activeAlertsCount === 0 || !latestAlert) {
    return (
      <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-success/5 border border-success/20 mb-6 transition-all duration-500">
        <div className="p-2 rounded-xl bg-success/10 text-success">
          <CheckCircle2 size={24} />
        </div>
        <div>
          <h3 className="text-sm font-black text-success uppercase tracking-wider">System Operating Normally</h3>
          <p className="text-xs text-success/60 font-bold uppercase tracking-widest mt-0.5">
            01-LGS-NORTH Node • All parameters within nominal range
          </p>
        </div>
      </div>
    );
  }

  const isCritical = latestAlert.severity === "CRITICAL" || latestAlert.severity === "HIGH";

  return (
    <div className={`relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4 px-8 py-6 rounded-2xl border-2 mb-6 transition-all duration-500 ${
      isCritical 
        ? 'bg-critical/10 border-critical/40 text-critical shadow-[0_0_30px_rgba(239,68,68,0.15)] animate-pulse' 
        : 'bg-warning/10 border-warning/40 text-warning'
    }`}>
      {/* Background Animated Glitch/Shimmer */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer pointer-events-none" />
      
      <div className="flex items-center gap-6 relative z-10">
        <div className={`p-4 rounded-2xl ${isCritical ? 'bg-critical text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-warning text-black'}`}>
          <AlertCircle size={32} />
        </div>
        
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Critical System Alert</span>
            <span className="h-1 w-1 rounded-full bg-current" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Action Required</span>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter leading-tight">
            {latestAlert.type}: {latestAlert.message}
          </h2>
          
          <div className="flex flex-wrap items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-xs font-bold opacity-80 decoration-critical/30">
              <MapPin size={14} />
              <span>{latestAlert.transformer?.location || "Unknown Location"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold opacity-80">
              <Clock size={14} />
              <span>{new Date(latestAlert.createdAt).toLocaleTimeString()}</span>
            </div>
            <div className="px-2 py-0.5 rounded-full bg-critical/20 border border-critical/30 text-[10px] font-black uppercase tracking-widest">
              {activeAlertsCount} ACTIVE ALERTS
            </div>
          </div>
        </div>
      </div>

      <button className={`relative z-10 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95 ${
        isCritical ? 'bg-critical text-white shadow-lg' : 'bg-warning text-black shadow-lg'
      }`}>
        Acknowledge Critical
      </button>
    </div>
  );
}
