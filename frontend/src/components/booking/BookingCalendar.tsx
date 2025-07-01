'use client';

import React, { useState, useMemo } from 'react';
import { CalendarGrid } from './CalendarGrid';
import { TimeSlotsList } from './TimeSlotsList';
import { TimezoneSelector } from './TimezoneSelector';
import { AvailableTimeSlot, getClientTimezone } from '@/lib/api';

interface BookingCalendarProps {
  availability: AvailableTimeSlot[];
  onSlotSelect: (slot: AvailableTimeSlot) => void;
  isBooking: boolean;
  firmName: string;
}

export function BookingCalendar({ availability, onSlotSelect, firmName, isBooking }: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [clientTimezone, setClientTimezone] = useState(getClientTimezone());

  const availableDates = useMemo(() => {
    const dates = new Set<string>();
    availability.forEach(slot => {
      dates.add(new Date(slot.start_time).toISOString().split('T')[0]);
    });
    return Array.from(dates).map(dateStr => new Date(dateStr + 'T00:00:00'));
  }, [availability]);

  const timeSlotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return availability.filter(slot => {
      const slotDate = new Date(slot.start_time);
      return (
        slotDate.getFullYear() === selectedDate.getFullYear() &&
        slotDate.getMonth() === selectedDate.getMonth() &&
        slotDate.getDate() === selectedDate.getDate()
      );
    });
  }, [selectedDate, availability]);

  const handleDateSelect = (date: Date | null) => {
    setSelectedDate(date);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Select a Date & Time</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <CalendarGrid
            availableDates={availableDates}
            onDateSelect={handleDateSelect}
            selectedDate={selectedDate}
          />
        </div>
        <div>
          {selectedDate && (
            <TimeSlotsList
              slots={timeSlotsForSelectedDate}
              onSlotSelect={onSlotSelect}
              selectedDate={selectedDate}
              isBooking={isBooking}
            />
          )}
        </div>
      </div>
      <div className="mt-6">
        <TimezoneSelector
          selectedTimezone={clientTimezone}
          onTimezoneChange={setClientTimezone}
        />
      </div>
    </div>
  );
}