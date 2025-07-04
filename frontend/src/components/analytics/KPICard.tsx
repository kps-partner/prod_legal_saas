import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  description: string;
  trend?: number;
  icon: React.ReactNode;
  color: string;
  tooltip: string;
}

export function KPICard({ title, value, description, trend = 0, icon, color, tooltip }: KPICardProps) {
  const isPositive = trend > 0;
  const trendColor = isPositive ? 'text-green-600' : 'text-red-600';
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  const showTrend = trend !== undefined && trend !== 0; // Hide trend when no comparison data available

  return (
    <Tooltip>
      <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
          <div className="flex items-center gap-1">
            <CardTitle className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              {title}
            </CardTitle>
            <TooltipTrigger asChild>
              <button className="focus:outline-none">
                <HelpCircle className="h-3 w-3 text-gray-400 hover:text-gray-600 cursor-help transition-colors" />
              </button>
            </TooltipTrigger>
          </div>
          <div className={cn("p-1.5 rounded-lg", color)}>
            {React.cloneElement(icon as React.ReactElement, { className: "h-4 w-4 text-white" })}
          </div>
        </CardHeader>
        <CardContent className="pt-1">
          <div className="text-lg font-bold text-gray-900 mb-1">
            {value}
          </div>
          {showTrend && (
            <div className={cn("flex items-center text-xs", trendColor)}>
              <TrendIcon className="h-3 w-3 mr-1" />
              <span className="font-medium">
                {isPositive ? '+' : ''}{Math.abs(trend)}%
              </span>
              <span className="text-gray-500 ml-1">vs last period</span>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {description}
          </p>
        </CardContent>
      </Card>
      <TooltipContent side="top" className="max-w-sm p-3 z-50">
        <p className="text-sm leading-relaxed">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}