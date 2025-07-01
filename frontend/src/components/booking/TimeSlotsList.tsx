'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { AvailableTimeSlot } from '@/lib/api';

interface TimeSlotsListProps {
  slots: AvailableTimeSlot[];
  onSlotSelect: (slot: AvailableTimeSlot) => void;
  selectedDate: Date;
  isBooking: boolean;
}

export function TimeSlotsList({ slots, onSlotSelect, selectedDate, isBooking }: TimeSlotsListProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">
        {selectedDate.toLocaleDateString('default', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}
      </h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {slots.map((slot, index) => (
          <Button
            key={index}
            variant="outline"
            className="w-full justify-center py-3"
            onClick={() => onSlotSelect(slot)}
            disabled={isBooking}
          >
            {new Date(slot.start_time).toLocaleTimeString('default', {
              hour: 'numeric',
              minute: 'numeric',
              hour12: true,
            })}
          </Button>
        ))}
      </div>
    </div>
  );
}