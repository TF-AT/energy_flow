"use client";

import { useEffect, useState, use } from "react";
import Layout from "../../../components/Layout";
import VoltageChart from "../../../charts/VoltageChart";
import GenericMetricsChart from "../../../charts/GenericMetricsChart";
import AlertTable from "../../../components/AlertTable";
import { api } from "../../../lib/api";
import { Transformer, EnergyReading } from "../../../lib/types";
import { usePolling } from "../../../lib/hooks";
import { Server, Activity, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TransformerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [transformer, setTransformer] = useState<Transformer | null>(null);
  const [readings, setReadings] = useState<EnergyReading[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [tData, rData] = await Promise.all([
        api.getTransformerById(id),
        api.getReadings(id, 50)
      ]);
      setTransformer(tData);
      setReadings(rData);
    } catch (error) {
      console.error("Failed to fetch transformer details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  usePolling(fetchData, 10000);

  if (loading || !transformer) {
    return (
      <Layout>
        <div className="animate-pulse flex flex-col gap-8">
          <div className="h-20 bg-[#16161a] rounded-2xl border border-[#2d2d33]" />
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 h-[400px] bg-[#16161a] rounded-2xl border border-[#2d2d33]" />
            <div className="h-[400px] bg-[#16161a] rounded-2xl border border-[#2d2d33]" />
          </div>
        </div>
      </Layout>
    );
  }

  const latestReading = readings[0];

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-8">
          <Link href="/transformers" className="inline-flex items-center gap-2 text-sm font-bold text-[#64748b] hover:text-blue-400 transition-colors mb-4 group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Infrastructure List
          </Link>
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-black text-white">{transformer.id}</h2>
              <p className="text-sm text-[#64748b] font-medium">{transformer.location}</p>
            </div>
            <div className="flex gap-4">
              <MetricItem label="Live Voltage" value={`${latestReading?.voltage.toFixed(1) || "0.0"}V`} color="text-blue-400" />
              <MetricItem label="Load" value={`${latestReading?.current.toFixed(1) || "0.0"}A`} color="text-amber-400" />
              <MetricItem label="Frequency" value={`${latestReading?.frequency.toFixed(2) || "50.00"}Hz`} color="text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 space-y-8">
            <VoltageChart data={readings} title="Voltage Trend (V)" height={300} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <GenericMetricsChart 
                data={readings} 
                dataKey="current" 
                title="Current Load (A)" 
                color="#f59e0b" 
                unit="A" 
                domain={[0, 100]} 
              />
              <GenericMetricsChart 
                data={readings} 
                dataKey="frequency" 
                title="Frequency (Hz)" 
                color="#10b981" 
                unit="Hz" 
                domain={[48, 52]} 
              />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold mb-4 text-[#64748b] uppercase tracking-widest">Device History & Alerts</h3>
            <AlertTable alerts={transformer.alerts || []} compact />
          </div>
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
