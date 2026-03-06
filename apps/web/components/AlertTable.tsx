import React from "react";
import { Alert } from "../lib/types";
import { AlertTriangle, Clock, Server, Info, ShieldAlert } from "lucide-react";

export default function AlertTable({ alerts, compact = false }: { alerts: Alert[]; compact?: boolean }) {
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 pro-card border-dashed text-text-muted gap-3">
        <div className="p-4 bg-success/5 rounded-full border border-success/10">
          <Info size={32} className="text-success" opacity={0.5} />
        </div>
        <p className="font-black text-[10px] tracking-[0.3em] uppercase">Security Uplink Stable - Status Nominal</p>
      </div>
    );
  }

  return (
    <div className="pro-card overflow-hidden">
      {!compact && (
        <div className="px-8 py-6 border-b border-[#1e1e24] flex items-center justify-between bg-[#14141a]">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-critical/10 rounded-lg border border-critical/20">
              <ShieldAlert className="text-critical" size={20} />
            </div>
            <div>
               <h3 className="text-sm font-black text-text-primary uppercase tracking-widest">Incident Response Log</h3>
               <p className="text-critical/70 font-bold uppercase tracking-[0.2em] mt-0.5 text-[10px]">Prioritized by Severity & Asset Impact</p>
            </div>
          </div>
          <div className="flex gap-2">
             <Badge label="Critical" count={alerts.length} color="bg-critical" />
             <div className="h-6 w-px bg-card-border mx-2" />
             <button className="px-3 py-1 bg-card-border hover:bg-white/5 border border-white/10 text-[9px] font-black text-text-primary uppercase tracking-widest rounded-lg transition-colors">Export Logs</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#0f0f13] text-[9px] font-black text-[#475569] uppercase tracking-[0.2em] border-b border-[#1e1e24]">
              <th className="px-8 py-4">Status</th>
              <th className="px-8 py-4">Asset Identification</th>
              <th className="px-8 py-4">Diagnostic Event</th>
              {!compact && <th className="px-8 py-4">Operator Brief</th>}
              <th className="px-8 py-4 text-right">Detection Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e1e24]">
            {alerts.map((alert) => (
              <tr key={alert.id} className={`transition-colors ${alert.severity === 'CRITICAL' || true ? 'bg-critical/[0.03] hover:bg-critical/[0.05]' : 'hover:bg-white/[0.02]'}`}>
                <td className="px-8 py-5">
                   <div className="flex items-center gap-2">
                     <span className="h-1.5 w-1.5 rounded-full bg-critical animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                     <span className="text-[9px] font-black text-critical uppercase tracking-widest">Active</span>
                   </div>
                </td>
                <td className="px-8 py-5">
                   <div className="font-mono text-[13px] font-heavy text-text-primary tracking-tight">
                     {alert.transformerId}
                   </div>
                   <div className="text-[8px] text-text-muted font-black uppercase tracking-widest mt-0.5">Node ID: INFRA-LGS-1</div>
                </td>
                <td className="px-8 py-5">
                   <span className="text-[10px] font-black text-text-primary bg-card-border px-2 py-1 rounded-md border border-white/5">
                     {alert.type}
                   </span>
                </td>
                {!compact && (
                  <td className="px-8 py-5">
                    <p className="text-[11px] font-bold text-text-secondary leading-tight">
                      {alert.message}
                    </p>
                  </td>
                )}
                <td className="px-8 py-5 text-right font-mono text-[11px] text-[#64748b] font-bold">
                  {new Date(alert.createdAt).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Badge({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-card-border rounded-lg border border-white/5">
       <div className={`h-1.5 w-1.5 rounded-full ${color}`} />
       <span className="text-[9px] font-black text-text-primary uppercase tracking-widest">{label}: {count}</span>
    </div>
  );
}
