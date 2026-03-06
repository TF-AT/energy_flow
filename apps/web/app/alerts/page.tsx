"use client";

import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import AlertTable from "../../components/AlertTable";
import { api } from "../../lib/api";
import { Alert } from "../../lib/types";
import { usePolling } from "../../lib/hooks";
import { Filter } from "lucide-react";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const data = await api.getAlerts();
      setAlerts(data);
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  usePolling(fetchData, 10000);

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black text-text-primary">System Alerts</h2>
            <p className="text-sm text-text-muted font-medium">Comprehensive history of grid anomalies and critical failures.</p>
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-card-bg border border-card-border rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary transition-all">
            <Filter size={14} />
            Filter Logs
          </button>
        </div>

        <AlertTable alerts={alerts} />
      </div>
    </Layout>
  );
}
