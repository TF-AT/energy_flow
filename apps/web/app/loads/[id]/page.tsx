"use client";

import { useEffect, useState, use } from "react";
import Layout from "../../../components/Layout";
import GenericMetricsChart from "../../../charts/GenericMetricsChart";
import { api } from "../../../lib/api";
import { EnergyLoad, LoadReading } from "../../../lib/types";
import { usePolling } from "../../../lib/hooks";
import { Activity, Zap, ArrowLeft, TrendingUp } from "lucide-react";
import Link from "next/link";
import Breadcrumbs from "../../../components/Breadcrumbs";

export default function LoadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [load, setLoad] = useState<EnergyLoad | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const data = await api.getLoadById(id);
      setLoad(data);
    } catch (error) {
      console.error("Failed to fetch load details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  usePolling(fetchData, 10000);

  if (loading || !load) {
    return (
      <Layout>
        <div className="animate-pulse space-y-8">
          <div className="h-20 bg-[#16161a] rounded-2xl border border-[#2d2d33]" />
          <div className="grid grid-cols-2 gap-8">
            <div className="h-[400px] bg-[#16161a] rounded-2xl border border-[#2d2d33]" />
            <div className="h-[400px] bg-[#16161a] rounded-2xl border border-[#2d2d33]" />
          </div>
        </div>
      </Layout>
    );
  }

  const readings = load.readings || [];
  const latestReading = readings[0];

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto">
        <Breadcrumbs 
          items={[
            { label: "Load Centers", href: "/loads" },
            { label: load.id }
          ]} 
        />
        <div className="mb-8">
          <Link href="/loads" className="inline-flex items-center gap-2 text-sm font-bold text-[#64748b] hover:text-blue-400 transition-colors mb-4 group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Load Network
          </Link>
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{load.id}</h2>
              <p className="text-sm text-[#64748b] font-medium">{load.location} • Consumption Node</p>
            </div>
            <div className="flex gap-8">
              <MetricItem label="Consumption" value={`${latestReading?.consumption_kw.toFixed(1) || "0.0"} kW`} color="text-blue-400" />
              <MetricItem label="Peak Demand" value={`${latestReading?.peak_demand_kw.toFixed(1) || "0.0"} kW`} color="text-rose-400" />
              <MetricItem label="Load Factor" value={latestReading ? (latestReading.consumption_kw / latestReading.peak_demand_kw * 100).toFixed(1) + "%" : "0.0%"} color="text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <GenericMetricsChart 
            data={readings} 
            dataKey="consumption_kw" 
            title="Consumption Profile (kW)" 
            color="#3b82f6" 
            unit="kW" 
          />
          <GenericMetricsChart 
            data={readings} 
            dataKey="peak_demand_kw" 
            title="Demand Tracking (kW)" 
            color="#f43f5e" 
            unit="kW" 
          />
        </div>
      </div>
    </Layout>
  );
}

function MetricItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-right">
      <div className="text-[10px] font-black text-[#64748b] uppercase tracking-tighter mb-1">{label}</div>
      <div className={`text-xl font-black ${color}`}>{value}</div>
    </div>
  );
}
