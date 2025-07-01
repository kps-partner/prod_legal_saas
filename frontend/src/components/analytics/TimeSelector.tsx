import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type TimePeriod = 'all_time' | 'this_week' | 'this_month' | 'last_7_days' | 'last_30_days' | 'this_quarter';

interface TimeSelectorProps {
  value: TimePeriod;
  onChange: (value: TimePeriod) => void;
}

const TIME_PERIODS = [
  { value: 'last_30_days' as TimePeriod, label: 'Last 30 Days' },
  { value: 'last_7_days' as TimePeriod, label: 'Last 7 Days' },
  { value: 'this_week' as TimePeriod, label: 'This Week' },
  { value: 'this_month' as TimePeriod, label: 'This Month' },
  { value: 'this_quarter' as TimePeriod, label: 'This Quarter' },
  { value: 'all_time' as TimePeriod, label: 'All Time' },
];

export function TimeSelector({ value, onChange }: TimeSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700">Time Period:</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select period" />
        </SelectTrigger>
        <SelectContent>
          {TIME_PERIODS.map((period) => (
            <SelectItem key={period.value} value={period.value}>
              {period.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}