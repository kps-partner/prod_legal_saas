'use client';

import React, { useState } from 'react';
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
  Timer
} from 'lucide-react';

// Mock data interfaces
interface KPIData {
  newLeads: { value: number; trend: number; description: string };
  consultations: { value: number; trend: number; description: string };
  engagedClients: { value: number; trend: number; description: string };
  avgEngageTime: { value: string; trend: number; description: string };
  engageRate: { value: string; trend: number; description: string };
  consultRate: { value: string; trend: number; description: string };
  pipelineValue: { value: string; trend: number; description: string };
  avgCloseTime: { value: string; trend: number; description: string };
}

interface ChartDataPoint {
  date: string;
  signedClients: number;
  displayDate: string;
}

// Mock data generator
const generateMockData = (period: TimePeriod): { kpis: KPIData; chartData: ChartDataPoint[] } => {
  // Base KPI data with variations based on time period
  const baseKPIs: KPIData = {
    newLeads: { value: 24, trend: 12, description: 'Total leads this period' },
    consultations: { value: 18, trend: 6, description: 'Scheduled meetings' },
    engagedClients: { value: 12, trend: 25, description: 'Signed clients' },
    avgEngageTime: { value: '8.5 days', trend: -15, description: 'To engage clients' },
    engageRate: { value: '50%', trend: 8, description: 'Conversion to signed' },
    consultRate: { value: '75%', trend: -3, description: 'Show rate for meetings' },
    pipelineValue: { value: '$45,000', trend: 18, description: 'Potential revenue' },
    avgCloseTime: { value: '15.2 days', trend: 12, description: 'To close cases' },
  };

  // Adjust values based on time period
  const multiplier = period === 'all_time' ? 5 : period === 'this_quarter' ? 3 : period === 'this_month' ? 2 : 1;
  
  const adjustedKPIs: KPIData = {
    newLeads: { ...baseKPIs.newLeads, value: Math.round(baseKPIs.newLeads.value * multiplier) },
    consultations: { ...baseKPIs.consultations, value: Math.round(baseKPIs.consultations.value * multiplier) },
    engagedClients: { ...baseKPIs.engagedClients, value: Math.round(baseKPIs.engagedClients.value * multiplier) },
    avgEngageTime: baseKPIs.avgEngageTime,
    engageRate: baseKPIs.engageRate,
    consultRate: baseKPIs.consultRate,
    pipelineValue: { 
      ...baseKPIs.pipelineValue, 
      value: `$${(45000 * multiplier).toLocaleString()}` 
    },
    avgCloseTime: baseKPIs.avgCloseTime,
  };

  // Generate chart data
  const chartData: ChartDataPoint[] = [];
  const days = period === 'last_7_days' ? 7 : period === 'last_30_days' ? 30 : 30;
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    chartData.push({
      date: date.toISOString().split('T')[0],
      signedClients: Math.floor(Math.random() * 8) + 2, // Random between 2-10
      displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    });
  }

  return { kpis: adjustedKPIs, chartData };
};

export function CaseAnalytics() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('last_30_days');
  const { kpis, chartData } = generateMockData(timePeriod);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-6">
        {/* Header with Time Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Case Management Analytics</h2>
            <p className="text-gray-600 mt-1">Track your firm's performance and conversion metrics</p>
          </div>
          <TimeSelector value={timePeriod} onChange={setTimePeriod} />
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          title="Pipeline Value"
          value={kpis.pipelineValue.value}
          description={kpis.pipelineValue.description}
          trend={kpis.pipelineValue.trend}
          icon={<FileText className="h-5 w-5 text-white" />}
          color="bg-teal-500"
          tooltip="Total estimated revenue value of all active prospects in your sales pipeline. This includes potential fees from leads, scheduled consultations, and cases under review but not yet engaged."
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