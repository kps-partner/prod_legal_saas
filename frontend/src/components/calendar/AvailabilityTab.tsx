'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { apiClient, AvailabilitySettings, TimezoneOption, WeeklySchedule, TimeSlot } from '@/lib/api';
import { TimeRangeInput } from './TimeRangeInput';

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

const DEFAULT_TIME_SLOT: TimeSlot = {
  enabled: false,
  start_time: '09:00',
  end_time: '17:00',
};

export function AvailabilityTab() {
  const [availability, setAvailability] = useState<AvailabilitySettings | null>(null);
  const [timezones, setTimezones] = useState<TimezoneOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [availabilityData, timezonesData] = await Promise.all([
        apiClient.getAvailability(),
        apiClient.getTimezones(),
      ]);
      
      setAvailability(availabilityData);
      setTimezones(timezonesData.timezones);
    } catch (error) {
      console.error('Error fetching availability data:', error);
      setError('Failed to load availability settings');
    } finally {
      setLoading(false);
    }
  };

  const handleTimezoneChange = (timezone: string) => {
    if (availability) {
      setAvailability({
        ...availability,
        timezone,
      });
    }
  };

  const handleDayToggle = (dayKey: string, enabled: boolean) => {
    if (!availability) return;

    const updatedSchedule = {
      ...availability.weekly_schedule,
      [dayKey]: {
        ...availability.weekly_schedule[dayKey as keyof WeeklySchedule],
        enabled,
      },
    };

    setAvailability({
      ...availability,
      weekly_schedule: updatedSchedule,
    });
  };

  const handleTimeChange = (dayKey: string, field: 'start_time' | 'end_time', value: string) => {
    if (!availability) return;

    const updatedSchedule = {
      ...availability.weekly_schedule,
      [dayKey]: {
        ...availability.weekly_schedule[dayKey as keyof WeeklySchedule],
        [field]: value,
      },
    };

    setAvailability({
      ...availability,
      weekly_schedule: updatedSchedule,
    });
  };

  const handleSetBusinessHours = () => {
    if (!availability) return;

    const businessHoursSchedule: WeeklySchedule = {
      monday: { enabled: true, start_time: '09:00', end_time: '17:00' },
      tuesday: { enabled: true, start_time: '09:00', end_time: '17:00' },
      wednesday: { enabled: true, start_time: '09:00', end_time: '17:00' },
      thursday: { enabled: true, start_time: '09:00', end_time: '17:00' },
      friday: { enabled: true, start_time: '09:00', end_time: '17:00' },
      saturday: { enabled: false, start_time: '09:00', end_time: '17:00' },
      sunday: { enabled: false, start_time: '09:00', end_time: '17:00' },
    };

    setAvailability({
      ...availability,
      weekly_schedule: businessHoursSchedule,
    });
  };

  const handleClearAll = () => {
    if (!availability) return;

    const clearedSchedule: WeeklySchedule = {
      monday: DEFAULT_TIME_SLOT,
      tuesday: DEFAULT_TIME_SLOT,
      wednesday: DEFAULT_TIME_SLOT,
      thursday: DEFAULT_TIME_SLOT,
      friday: DEFAULT_TIME_SLOT,
      saturday: DEFAULT_TIME_SLOT,
      sunday: DEFAULT_TIME_SLOT,
    };

    setAvailability({
      ...availability,
      weekly_schedule: clearedSchedule,
    });
  };

  const handleSave = async () => {
    if (!availability) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await apiClient.updateAvailability({
        timezone: availability.timezone,
        weekly_schedule: availability.weekly_schedule,
      });

      setSuccess('Availability settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving availability:', error);
      setError(error instanceof Error ? error.message : 'Failed to save availability settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!availability) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load availability settings. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Timezone Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Timezone</span>
          </CardTitle>
          <CardDescription>
            Select your firm's timezone for scheduling appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={availability.timezone} onValueChange={handleTimezoneChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              {timezones.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  <div className="flex items-center justify-between w-full">
                    <span>{tz.label}</span>
                    <span className="text-sm text-muted-foreground ml-2">{tz.offset}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Weekly Schedule */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Weekly Schedule</CardTitle>
              <CardDescription>
                Set your available hours for each day of the week
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleSetBusinessHours}>
                Set Business Hours
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearAll}>
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {DAYS_OF_WEEK.map((day) => {
              const daySchedule = availability.weekly_schedule[day.key as keyof WeeklySchedule];
              return (
                <div key={day.key} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 w-24">
                    <Switch
                      checked={daySchedule.enabled}
                      onCheckedChange={(enabled) => handleDayToggle(day.key, enabled)}
                    />
                    <Label className="font-medium">{day.label}</Label>
                  </div>
                  
                  {daySchedule.enabled ? (
                    <div className="flex items-center space-x-2 flex-1">
                      <TimeRangeInput
                        startTime={daySchedule.start_time}
                        endTime={daySchedule.end_time}
                        onStartTimeChange={(value) => handleTimeChange(day.key, 'start_time', value)}
                        onEndTimeChange={(value) => handleTimeChange(day.key, 'end_time', value)}
                      />
                    </div>
                  ) : (
                    <div className="flex-1 text-sm text-muted-foreground">
                      Not available
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}