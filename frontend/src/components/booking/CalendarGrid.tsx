'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CalendarGridProps {
  availableDates: Date[];
  onDateSelect: (date: Date | null) => void;
  selectedDate: Date | null;
}

export function CalendarGrid({ availableDates, onDateSelect, selectedDate }: CalendarGridProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const startDate = new Date(startOfMonth);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  const endDate = new Date(endOfMonth);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  const dates = [];
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const isDateAvailable = (date: Date) => {
    return availableDates.some(
      availableDate =>
        date.getFullYear() === availableDate.getFullYear() &&
        date.getMonth() === availableDate.getMonth() &&
        date.getDate() === availableDate.getDate()
    );
  };

  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false;
    return (
      date.getFullYear() === selectedDate.getFullYear() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getDate() === selectedDate.getDate()
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h3 className="text-lg font-semibold">
          {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h3>
        <Button variant="ghost" size="icon" onClick={handleNextMonth}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center text-sm text-gray-500">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
          <div key={day}>{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2 mt-2">
        {dates.map((date, index) => {
          const isAvailable = isDateAvailable(date);
          const isSelected = isDateSelected(date);
          const isCurrentMonth = date.getMonth() === currentMonth.getMonth();

          return (
            <Button
              key={index}
              variant="ghost"
              className={cn(
                'h-10 w-10 p-0 rounded-full',
                !isCurrentMonth && 'text-gray-400',
                isAvailable && 'hover:bg-blue-100',
                isSelected && 'bg-blue-500 text-white hover:bg-blue-600'
              )}
              disabled={!isAvailable}
              onClick={() => onDateSelect(date)}
            >
              {date.getDate()}
            </Button>
          );
        })}
      </div>
    </div>
  );
}