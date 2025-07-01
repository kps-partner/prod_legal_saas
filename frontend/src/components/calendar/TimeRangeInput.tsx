'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TimeRangeInputProps {
  startTime: string;
  endTime: string;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  disabled?: boolean;
}

export function TimeRangeInput({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  disabled = false,
}: TimeRangeInputProps) {
  const validateTime = (time: string): boolean => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (validateTime(value) || value === '') {
      onStartTimeChange(value);
    }
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (validateTime(value) || value === '') {
      onEndTimeChange(value);
    }
  };

  const isValidTimeRange = (): boolean => {
    if (!validateTime(startTime) || !validateTime(endTime)) {
      return true; // Don't show error if times are incomplete
    }
    
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return endMinutes > startMinutes;
  };

  return (
    <div className="flex items-center space-x-3">
      <div className="flex flex-col space-y-1">
        <Label htmlFor="start-time" className="text-xs text-muted-foreground">
          Start
        </Label>
        <Input
          id="start-time"
          type="time"
          value={startTime}
          onChange={handleStartTimeChange}
          disabled={disabled}
          className={`w-24 ${!validateTime(startTime) && startTime !== '' ? 'border-red-500' : ''}`}
        />
      </div>
      
      <div className="flex items-center pt-5">
        <span className="text-muted-foreground">to</span>
      </div>
      
      <div className="flex flex-col space-y-1">
        <Label htmlFor="end-time" className="text-xs text-muted-foreground">
          End
        </Label>
        <Input
          id="end-time"
          type="time"
          value={endTime}
          onChange={handleEndTimeChange}
          disabled={disabled}
          className={`w-24 ${
            (!validateTime(endTime) && endTime !== '') || !isValidTimeRange() 
              ? 'border-red-500' 
              : ''
          }`}
        />
      </div>
      
      {!isValidTimeRange() && validateTime(startTime) && validateTime(endTime) && (
        <div className="text-xs text-red-500 pt-5">
          End time must be after start time
        </div>
      )}
    </div>
  );
}