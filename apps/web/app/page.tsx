"use client";

import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import DashboardStats from "../components/DashboardStats";
import AlertTable from "../components/AlertTable";
import VoltageChart from "../charts/VoltageChart";
import { api } from "../lib/api";
import { DashboardData } from "../lib/types";
import { usePolling } from "../lib/hooks";
import { Activity, ShieldCheck, ShieldAlert, Shield } from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [prevData, setPrevData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
    try {
      const result = await api.getDashboardData();
      setPrevData(data);
      setData(result);
    } catch (error) {
      console.error("Dashboard refresh failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  usePolling(refreshData, 10000);

  if (loading || !data) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="flex flex-col items-center gap-8">
            <Activity size={64} className="text-info animate-spin" strokeWidth={1} />
            <div className="text-center space-y-2">
              <p className="text-[10px] font-black tracking-[0.5em] text-text-muted animate-pulse uppercase">
                Synchronizing Lagos North Distribution Node
              </p>
              <div className="h-1 w-48 bg-card-border rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-info animate-shimmer" style={{ width: '40%' }} />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const currentReading = data.recentReadings[0];
  const lastReading = prevData?.recentReadings[0];
  
  const voltage = currentReading?.voltage ?? 0;
  const isCritical = data.activeAlertsCount > 0 || (voltage > 260 || (voltage > 0 && voltage < 185));
  const isWarning = !isCritical && (data.recentAlerts.length > 0 || (voltage > 240 || (voltage > 0 && voltage < 195)));

  return (
    <Layout>
      <div className="max-w-[1700px] mx-auto space-y-4 pb-20">
        {/* MASTER STATUS HEADER - The "3-Second Rule" Element */}
        <div className={`flex flex-col md:flex-row justify-between items-center px-10 py-8 rounded-2xl border-2 transition-colors duration-500 ${
          isCritical 
            ? 'bg-critical/[0.03] border-critical/30' 
            : isWarning 
              ? 'bg-warning/[0.03] border-warning/30' 
              : 'bg-success/[0.03] border-success/30'
        }`}>
          <div className="flex items-center gap-6">
            <div className={`p-5 rounded-2xl border-2 ${
              isCritical ? 'bg-critical/20 border-critical/40 text-critical' : 
              isWarning ? 'bg-warning/20 border-warning/40 text-warning' : 
              'bg-success/20 border-success/40 text-success shadow-[0_0_20px_rgba(16,185,129,0.1)]'
            }`}>
              {isCritical ? <ShieldAlert size={40} /> : isWarning ? <Shield size={40} /> : <ShieldCheck size={40} />}
            </div>
            <div>
               <h1 className={`text-4xl font-black uppercase tracking-tighter leading-none mb-2 ${
                 isCritical ? 'text-critical' : isWarning ? 'text-warning' : 'text-success'
               }`}>
                 {isCritical ? 'Node Critical' : isWarning ? 'Node Warning' : 'Node Healthy'}
               </h1>
               <p className="text-xs text-text-secondary font-bold uppercase tracking-[0.2em]">
                 01-LGS-NORTH Hub • Secondary Distribution Network
               </p>
            </div>
          </div>
          
          <div className="text-right mt-6 md:mt-0 flex flex-col items-end gap-2">
             <div className="flex items-center gap-3 bg-card-bg border border-card-border px-4 py-2 rounded-xl">
                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Response Ready</span>
                <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
             </div>
             <p className="font-mono text-[11px] font-black text-text-muted uppercase tracking-widest">
               Sync: {new Date().toLocaleTimeString([], { hour12: false })} • {data.transformersCount} Assets Active
             </p>
          </div>
        </div>

        {/* TOP: Critical Indicators */}
        <div className="pt-2">
          <DashboardStats 
            transformersCount={data.transformersCount}
            activeAlertsCount={data.activeAlertsCount}
            currentVoltage={currentReading?.voltage || 0}
            currentFrequency={currentReading?.frequency || 0}
            prevVoltage={lastReading?.voltage}
            prevFrequency={lastReading?.frequency}
          />
        </div>

        {/* MIDDLE: Diagnostic Trends */}
        <div className="grid grid-cols-1 gap-6">
           <VoltageChart data={data.recentReadings} height={420} />
        </div>

        {/* BOTTOM: Event Log */}
        <div className="pt-2">
           <AlertTable alerts={data.recentAlerts} />
        </div>
      </div>
    </Layout>
  );
}
