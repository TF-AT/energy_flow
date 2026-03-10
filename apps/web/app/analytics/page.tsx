"use client";

import React, { useEffect, useState, useMemo } from "react";
import Layout from "../../components/Layout";
import { api } from "../../lib/api";
import HistoryChart from "../../charts/HistoryChart";
import { Calendar, Filter, Download, Zap, Activity, Battery, Shield, TrendingUp, TrendingDown } from "lucide-react";

export default function AnalyticsPage() {
  const [powerData, setPowerData] = useState<any[]>([]);
  const [loadData, setLoadData] = useState<any[]>([]);
  const [batteryData, setBatteryData] = useState<any[]>([]);
  const [healthData, setHealthData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("24h");

  const fetchData = async () => {
    setLoading(true);
    try {
      const endTime = new Date().toISOString();
      const startTime = new Date(Date.now() - (timeRange === "24h" ? 24 : timeRange === "7d" ? 168 : 720) * 60 * 60 * 1000).toISOString();

      const [power, load, battery, health] = await Promise.all([
        api.getPowerAnalytics(startTime, endTime),
        api.getLoadAnalytics(startTime, endTime),
        api.getBatteryAnalytics(startTime, endTime),
        api.getGridHealthAnalytics(startTime, endTime),
      ]);

      setPowerData(power);
      setLoadData(load);
      setBatteryData(battery);
      setHealthData(health);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const kpis = useMemo(() => {
    const avgPower = powerData.reduce((acc, curr) => acc + curr.value, 0) / (powerData.length || 1);
    const peakLoad = Math.max(...loadData.map(d => d.value), 0);
    const avgHealth = healthData.reduce((acc, curr) => acc + curr.voltageStability, 0) / (healthData.length || 1);
    const lastSoc = batteryData[batteryData.length - 1]?.value || 0;

    return [
      { label: "Avg Generation", value: `${avgPower.toFixed(1)} kW`, icon: <Zap size={20} />, color: "text-blue-400", bg: "bg-blue-400/10" },
      { label: "Peak Demand", value: `${peakLoad.toFixed(1)} kW`, icon: <Activity size={20} />, color: "text-[#fbbf24]", bg: "bg-[#fbbf24]/10" },
      { label: "Grid Stability", value: `${avgHealth.toFixed(1)}%`, icon: <Shield size={20} />, color: "text-emerald-400", bg: "bg-emerald-400/10" },
      { label: "Storage Reserve", value: `${lastSoc.toFixed(1)}%`, icon: <Battery size={20} />, color: "text-purple-400", bg: "bg-purple-400/10" },
    ];
  }, [powerData, loadData, batteryData, healthData]);

  return (
    <Layout>
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Grid Analytics</h1>
            <p className="text-xs text-[#64748b] font-bold uppercase tracking-[0.2em] mt-1">Lagos North Distribution Intelligence</p>
          </div>

          <div className="flex items-center gap-3 bg-[#111114] border border-[#2d2d33] p-1 rounded-xl">
            {["24h", "7d", "30d"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                  timeRange === range ? "bg-[#2d2d33] text-white shadow-lg" : "text-[#64748b] hover:text-[#94a3b8]"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi, i) => (
            <div key={i} className="pro-card p-6 border border-[#2d2d33] bg-[#111114] rounded-2xl">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${kpi.bg} ${kpi.color}`}>
                  {kpi.icon}
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                  <TrendingUp size={12} />
                  <span>+2.4%</span>
                </div>
              </div>
              <h3 className="text-[10px] font-black text-[#64748b] uppercase tracking-widest">{kpi.label}</h3>
              <p className="text-2xl font-black text-white mt-1">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        {loading ? (
          <div className="h-[600px] flex items-center justify-center border border-[#2d2d33] bg-[#111114] rounded-2xl animate-pulse">
            <p className="text-[10px] font-black text-[#64748b] uppercase tracking-widest">Compiling Historical Telemetry...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <HistoryChart 
              data={powerData} 
              title="Generation Efficiency" 
              subtitle="Solar Array Performance Trends" 
              valueSuffix=" kW" 
              color="#60a5fa"
            />
            <HistoryChart 
              data={loadData} 
              title="Demand Profile" 
              subtitle="Site Load Consumption Trends" 
              valueSuffix=" kW" 
              color="#fbbf24"
            />
            <HistoryChart 
              data={batteryData} 
              title="Storage Cycles" 
              subtitle="Battery Bank State of Charge Trends" 
              valueSuffix="%" 
              color="#a78bfa"
              domain={[0, 100]}
            />
            <div className="pro-card p-6 border border-[#2d2d33] bg-[#111114] rounded-2xl">
               <div className="mb-6">
                  <h3 className="text-[10px] font-black text-[#64748b] uppercase tracking-[0.3em]">Grid Integrity Map</h3>
                  <p className="text-[9px] text-[#475569] font-bold mt-1 uppercase tracking-widest">Voltage vs Frequency Stability Score</p>
               </div>
               <div className="h-[300px] flex flex-col justify-center space-y-8">
                  <StabilityMetric label="Voltage Stability" score={healthData[healthData.length-1]?.voltageStability || 0} />
                  <StabilityMetric label="Frequency Stability" score={healthData[healthData.length-1]?.frequencyStability || 0} />
                  <div className="pt-4 border-t border-[#2d2d33]">
                     <div className="flex justify-between items-center bg-[#2d2d33]/20 p-4 rounded-xl border border-[#2d2d33]">
                        <div className="flex items-center gap-3">
                           <Shield className="text-emerald-400" size={20} />
                           <span className="text-[10px] font-black text-white uppercase tracking-widest">Network Health Rating</span>
                        </div>
                        <span className="text-lg font-black text-emerald-400">EXCELLENT</span>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* Export Footer */}
        <div className="flex justify-end pt-4">
           <button className="flex items-center gap-2 px-6 py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#e2e8f0] transition-all">
              <Download size={14} />
              Export Dataset (.CSV)
           </button>
        </div>
      </div>
    </Layout>
  );
}

function StabilityMetric({ label, score }: { label: string, score: number }) {
  const color = score > 90 ? "bg-emerald-400" : score > 70 ? "bg-[#fbbf24]" : "bg-critical";
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">{label}</span>
        <span className="text-sm font-black text-white">{score.toFixed(1)}%</span>
      </div>
      <div className="h-2 w-full bg-[#2d2d33] rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
