'use client';

import React, { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { apiClient, TimezoneOption } from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TimezoneSelectorProps {
  selectedTimezone: string;
  onTimezoneChange: (timezone: string) => void;
}

export function TimezoneSelector({ selectedTimezone, onTimezoneChange }: TimezoneSelectorProps) {
  const [timezones, setTimezones] = useState<TimezoneOption[]>([]);

  useEffect(() => {
    const fetchTimezones = async () => {
      try {
        const response = await apiClient.getTimezones();
        setTimezones(response.timezones);
      } catch (error) {
        console.error('Failed to fetch timezones:', error);
      }
    };
    fetchTimezones();
  }, []);

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600">
      <Globe className="h-5 w-5" />
      <Select value={selectedTimezone} onValueChange={onTimezoneChange}>
        <SelectTrigger className="w-auto bg-transparent border-none shadow-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {timezones.map(tz => (
            <SelectItem key={tz.value} value={tz.value}>
              {tz.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}