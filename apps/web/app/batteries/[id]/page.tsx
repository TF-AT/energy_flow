"use client";

import { useEffect, useState, use } from "react";
import Layout from "../../../components/Layout";
import GenericMetricsChart from "../../../charts/GenericMetricsChart";
import { api } from "../../../lib/api";
import { BatteryStorage, BatteryReading } from "../../../lib/types";
import { usePolling } from "../../../lib/hooks";
import { Battery, Thermometer, ArrowLeft, Zap } from "lucide-react";
import Link from "next/link";
import Breadcrumbs from "../../../components/Breadcrumbs";

export default function BatteryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [battery, setBattery] = useState<BatteryStorage | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const data = await api.getBatteryById(id);
      setBattery(data);
    } catch (error) {
      console.error("Failed to fetch battery details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  usePolling(fetchData, 10000);

  if (loading || !battery) {
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

  const readings = battery.readings || [];
  const latestReading = readings[0];

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto">
        <Breadcrumbs 
          items={[
            { label: "Energy Storage", href: "/batteries" },
            { label: battery.id }
          ]} 
        />
        <div className="mb-8">
          <Link href="/batteries" className="inline-flex items-center gap-2 text-sm font-bold text-[#64748b] hover:text-emerald-400 transition-colors mb-4 group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Storage Assets
          </Link>
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{battery.id}</h2>
              <p className="text-sm text-[#64748b] font-medium">{battery.location} • BESS Module</p>
            </div>
            <div className="flex gap-8">
              <MetricItem label="Charge (SOC)" value={`${latestReading?.soc_percentage.toFixed(1) || "0.0"}%`} color="text-emerald-400" />
              <MetricItem label="Thermal" value={`${latestReading?.temperature.toFixed(1) || "0.0"}°C`} color="text-amber-400" />
              <MetricItem label="Flow Rate" value={`${latestReading?.charge_rate_kw.toFixed(1) || "0.0"} kW`} color="text-blue-400" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <GenericMetricsChart 
            data={readings} 
            dataKey="soc_percentage" 
            title="State of Charge (%)" 
            color="#10b981" 
            unit="%" 
            domain={[0, 100]}
          />
          <GenericMetricsChart 
            data={readings} 
            dataKey="charge_rate_kw" 
            title="Charge/Discharge Rate (kW)" 
            color="#3b82f6" 
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
