'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AvailableTimeSlot } from '@/lib/api';
import { Calendar, Clock } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  slot: AvailableTimeSlot | null;
  isBooking: boolean;
}

export function ConfirmationDialog({ isOpen, onClose, onConfirm, slot, isBooking }: ConfirmationDialogProps) {
  if (!slot) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Your Appointment</DialogTitle>
          <DialogDescription>
            Please review your selected appointment time below.
          </DialogDescription>
        </DialogHeader>
        <div className="my-4">
          <div className="flex items-center space-x-2 bg-gray-100 p-4 rounded-md">
            <Calendar className="h-5 w-5 text-gray-600" />
            <span className="font-medium">{new Date(slot.start_time).toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <div className="flex items-center space-x-2 bg-gray-100 p-4 rounded-md mt-2">
            <Clock className="h-5 w-5 text-gray-600" />
            <span className="font-medium">{new Date(slot.start_time).toLocaleTimeString('default', { hour: 'numeric', minute: 'numeric', hour12: true })}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isBooking}>
            Back
          </Button>
          <Button onClick={onConfirm} disabled={isBooking}>
            {isBooking ? 'Booking...' : 'Confirm Appointment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}