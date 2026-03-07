import React from "react";
import { Alert } from "../lib/types";
import { Clock, AlertTriangle, AlertCircle, CheckCircle, Info } from "lucide-react";

interface EventTimelineProps {
  events: Alert[];
}

export default function EventTimeline({ events }: EventTimelineProps) {
  return (
    <div className="pro-card p-6 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-lg bg-info/10 text-info">
          <Clock size={16} />
        </div>
        <div>
          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Event Timeline</h3>
          <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest mt-0.5">Live Chronicle of Grid Operations</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="relative space-y-6 before:absolute before:inset-0 before:ml-[15px] before:h-full before:w-0.5 before:-translate-x-1/2 before:bg-card-border">
          {events.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">No recent events logged</p>
            </div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="relative flex gap-4">
                <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 bg-[#0a0a0c] z-10 ${
                  event.isResolved 
                    ? "border-success/30 text-success" 
                    : event.severity === "CRITICAL"
                      ? "border-critical/50 text-critical animate-pulse"
                      : "border-warning/30 text-warning"
                }`}>
                  {event.isResolved ? (
                    <CheckCircle size={14} />
                  ) : event.severity === "CRITICAL" ? (
                    <AlertCircle size={14} />
                  ) : (
                    <AlertTriangle size={14} />
                  )}
                </div>

                <div className={`flex-1 p-4 rounded-xl border transition-all duration-300 ${
                  event.isResolved 
                    ? "bg-success/[0.02] border-success/10" 
                    : event.severity === "CRITICAL"
                      ? "bg-critical/[0.03] border-critical/20"
                      : "bg-warning/[0.02] border-warning/10"
                }`}>
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${
                      event.isResolved ? "text-success" : event.severity === "CRITICAL" ? "text-critical" : "text-warning"
                    }`}>
                      {event.isResolved ? "RESOLVED" : event.severity}
                    </span>
                    <span className="text-[9px] font-mono text-text-muted">
                      {new Date(event.createdAt).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-text-primary leading-tight mb-1">
                    {event.type.replace(/_/g, " ")}
                  </h4>
                  <p className="text-[10px] text-text-secondary leading-relaxed mb-2 line-clamp-2">
                    {event.message}
                  </p>
                  <div className="flex items-center gap-2">
                    <Info size={10} className="text-text-muted" />
                    <span className="text-[9px] font-black text-text-muted uppercase tracking-wider">
                      {event.transformer?.location || "System Wide"}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
