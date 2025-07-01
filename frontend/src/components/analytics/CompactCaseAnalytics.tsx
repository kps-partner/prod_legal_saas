'use client';

import React, { useState, useEffect } from 'react';
import { TimeSelector, TimePeriod } from './TimeSelector';
import { SignedClientsChart } from './SignedClientsChart';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, HelpCircle, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient, AnalyticsResponse } from '@/lib/api';

interface CompactKPICardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon: React.ReactNode;
  color: string;
  tooltip: string;
}

function CompactKPICard({ title, value, trend = 0, icon, color, tooltip }: CompactKPICardProps) {
  const isPositive = trend > 0;
  const trendColor = isPositive ? 'text-green-600' : 'text-red-600';
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  const showTrend = trend !== undefined && trend !== 0;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2 bg-white rounded-lg border p-3 hover:shadow-md transition-shadow cursor-help">
          <div className={cn("p-1.5 rounded-md", color)}>
            {React.cloneElement(icon as React.ReactElement, { className: "h-3 w-3 text-white" })}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide truncate">
                {title}
              </p>
              <HelpCircle className="h-3 w-3 text-gray-400 flex-shrink-0" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900">{value}</span>
              {showTrend && (
                <div className={cn("flex items-center text-xs", trendColor)}>
                  <TrendIcon className="h-2.5 w-2.5 mr-0.5" />
                  <span className="font-medium">
                    {isPositive ? '+' : ''}{Math.abs(trend)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-sm p-3 z-50">
        <p className="text-sm leading-relaxed">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function CompactCaseAnalytics() {
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
      <div className="flex items-center justify-center h-16">
        <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-500 text-sm">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-16 bg-red-50 border border-red-200 rounded-md">
        <AlertCircle className="h-5 w-5 text-red-500" />
        <span className="ml-2 text-red-700 text-sm">{error}</span>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { kpis, chartData } = data;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-3">
        {/* Header with Time Selector */}
        <div className="flex justify-end">
          <TimeSelector value={timePeriod} onChange={setTimePeriod} />
        </div>

        {/* Compact KPI Cards in Single Row */}
        <div className="grid grid-cols-7 gap-2">
          <CompactKPICard
            title="New Leads"
            value={kpis.newLeads.value}
            trend={kpis.newLeads.trend}
            icon={<div />}
            color="bg-blue-500"
            tooltip="Total number of new potential clients who have expressed interest in your services during the selected time period."
          />
          <CompactKPICard
            title="Consultations"
            value={kpis.consultations.value}
            trend={kpis.consultations.trend}
            icon={<div />}
            color="bg-orange-500"
            tooltip="Number of scheduled consultation meetings with potential clients."
          />
          <CompactKPICard
            title="Engaged"
            value={kpis.engagedClients.value}
            trend={kpis.engagedClients.trend}
            icon={<div />}
            color="bg-green-500"
            tooltip="Number of clients who have signed engagement letters or retainer agreements."
          />
          <CompactKPICard
            title="Avg Engage"
            value={kpis.avgEngageTime.value}
            trend={kpis.avgEngageTime.trend}
            icon={<div />}
            color="bg-purple-500"
            tooltip="Average number of days from initial lead contact to client engagement."
          />
          <CompactKPICard
            title="Engage Rate"
            value={kpis.engageRate.value}
            trend={kpis.engageRate.trend}
            icon={<div />}
            color="bg-teal-500"
            tooltip="Percentage of new leads that convert to engaged clients."
          />
          <CompactKPICard
            title="Consult Rate"
            value={kpis.consultRate.value}
            trend={kpis.consultRate.trend}
            icon={<div />}
            color="bg-teal-500"
            tooltip="Percentage of scheduled consultations that actually occur."
          />
          <CompactKPICard
            title="Avg Close"
            value={kpis.avgCloseTime.value}
            trend={kpis.avgCloseTime.trend}
            icon={<div />}
            color="bg-purple-500"
            tooltip="Average number of days from client engagement to case closure."
          />
        </div>

        {/* Chart */}
        <SignedClientsChart data={chartData} />
      </div>
    </TooltipProvider>
  );
}