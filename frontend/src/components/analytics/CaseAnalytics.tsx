'use client';

import React, { useState, useEffect } from 'react';
import { KPICard } from './KPICard';
import { TimeSelector, TimePeriod } from './TimeSelector';
import { SignedClientsChart } from './SignedClientsChart';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  Target,
  Phone,
  FileText,
  Timer,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { apiClient, AnalyticsResponse, KPIData, ChartDataPoint } from '@/lib/api';

export function CaseAnalytics() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('last_30_days');
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getAnalytics(timePeriod);
        setData(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timePeriod]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-500">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-red-50 border border-red-200 rounded-md">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <span className="ml-2 text-red-700">{error}</span>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { kpis, chartData } = data;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-4">
        {/* Header with Time Selector */}
        <div className="flex justify-end">
          <TimeSelector value={timePeriod} onChange={setTimePeriod} />
        </div>

        {/* KPI Cards Grid - Two rows layout */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard
          title="New Leads"
          value={kpis.newLeads.value}
          description={kpis.newLeads.description}
          trend={kpis.newLeads.trend}
          icon={<BarChart3 className="h-5 w-5 text-white" />}
          color="bg-blue-500"
          tooltip="Total number of new potential clients who have expressed interest in your services during the selected time period. This includes leads from all sources: website forms, referrals, phone calls, and walk-ins."
        />
        <KPICard
          title="Consultations"
          value={kpis.consultations.value}
          description={kpis.consultations.description}
          trend={kpis.consultations.trend}
          icon={<Calendar className="h-5 w-5 text-white" />}
          color="bg-orange-500"
          tooltip="Number of scheduled consultation meetings with potential clients. This represents leads who have moved beyond initial contact to book a formal meeting to discuss their legal needs."
        />
        <KPICard
          title="Engaged Clients"
          value={kpis.engagedClients.value}
          description={kpis.engagedClients.description}
          trend={kpis.engagedClients.trend}
          icon={<CheckCircle className="h-5 w-5 text-white" />}
          color="bg-green-500"
          tooltip="Number of clients who have signed engagement letters or retainer agreements. These are prospects who have converted from leads to paying clients and represent successful case acquisitions."
        />
        <KPICard
          title="Avg Engage Time"
          value={kpis.avgEngageTime.value}
          description={kpis.avgEngageTime.description}
          trend={kpis.avgEngageTime.trend}
          icon={<Clock className="h-5 w-5 text-white" />}
          color="bg-purple-500"
          tooltip="Average number of days from initial lead contact to client engagement (signing retainer). This metric helps measure the efficiency of your intake process and identifies opportunities to accelerate conversions."
        />
        <KPICard
          title="Engage Rate"
          value={kpis.engageRate.value}
          description={kpis.engageRate.description}
          trend={kpis.engageRate.trend}
          icon={<Target className="h-5 w-5 text-white" />}
          color="bg-teal-500"
          tooltip="Percentage of new leads that convert to engaged clients. Calculated as (Engaged Clients ÷ New Leads) × 100. This is a key performance indicator for measuring the effectiveness of your sales process."
        />
        <KPICard
          title="Consult Rate"
          value={kpis.consultRate.value}
          description={kpis.consultRate.description}
          trend={kpis.consultRate.trend}
          icon={<Phone className="h-5 w-5 text-white" />}
          color="bg-teal-500"
          tooltip="Percentage of scheduled consultations that actually occur (show rate). Calculated as (Completed Consultations ÷ Scheduled Consultations) × 100. Higher rates indicate better scheduling processes and client commitment."
        />
        <KPICard
          title="Avg Close Time"
          value={kpis.avgCloseTime.value}
          description={kpis.avgCloseTime.description}
          trend={kpis.avgCloseTime.trend}
          icon={<Timer className="h-5 w-5 text-white" />}
          color="bg-purple-500"
          tooltip="Average number of days from client engagement to case closure or resolution. This metric helps track case efficiency and can be used for better client expectations and resource planning."
        />
        </div>

        {/* Chart */}
        <SignedClientsChart data={chartData} />
      </div>
    </TooltipProvider>
  );
}