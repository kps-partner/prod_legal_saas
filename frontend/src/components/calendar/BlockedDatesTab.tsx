'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle, AlertCircle, Calendar, Trash2, Plus, AlertTriangle } from 'lucide-react';
import { apiClient, BlockedDate, ConflictWarning } from '@/lib/api';

export function BlockedDatesTab() {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictWarning[]>([]);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [pendingBlockedDate, setPendingBlockedDate] = useState<{
    start_date: string;
    end_date: string;
    reason: string;
  } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    reason: '',
  });

  useEffect(() => {
    fetchBlockedDates();
  }, []);

  const fetchBlockedDates = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getBlockedDates();
      setBlockedDates(data.blocked_dates);
    } catch (error) {
      console.error('Error fetching blocked dates:', error);
      setError('Failed to load blocked dates');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      start_date: '',
      end_date: '',
      reason: '',
    });
  };

  const validateForm = (): boolean => {
    if (!formData.start_date || !formData.end_date) {
      setError('Please select both start and end dates');
      return false;
    }

    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      setError('Start date cannot be in the past');
      return false;
    }

    if (endDate < startDate) {
      setError('End date must be after start date');
      return false;
    }

    return true;
  };

  const checkConflicts = async (startDate: string, endDate: string): Promise<ConflictWarning[]> => {
    try {
      const response = await apiClient.checkAppointmentConflicts(startDate, endDate);
      return response.conflicts;
    } catch (error) {
      console.error('Error checking conflicts:', error);
      return [];
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      setError('');

      // Check for conflicts
      const conflictWarnings = await checkConflicts(formData.start_date, formData.end_date);
      
      if (conflictWarnings.length > 0) {
        setConflicts(conflictWarnings);
        setPendingBlockedDate(formData);
        setShowConflictDialog(true);
        return;
      }

      // No conflicts, proceed with creation
      await createBlockedDate();
    } catch (error) {
      console.error('Error creating blocked date:', error);
      setError(error instanceof Error ? error.message : 'Failed to create blocked date');
    } finally {
      setSaving(false);
    }
  };

  const createBlockedDate = async () => {
    const dataToSubmit = pendingBlockedDate || formData;
    
    try {
      await apiClient.createBlockedDate({
        start_date: dataToSubmit.start_date,
        end_date: dataToSubmit.end_date,
        reason: dataToSubmit.reason,
      });

      setSuccess('Blocked date created successfully!');
      setTimeout(() => setSuccess(''), 3000);
      
      resetForm();
      setIsDialogOpen(false);
      setShowConflictDialog(false);
      setPendingBlockedDate(null);
      setConflicts([]);
      
      await fetchBlockedDates();
    } catch (error) {
      console.error('Error creating blocked date:', error);
      setError(error instanceof Error ? error.message : 'Failed to create blocked date');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteBlockedDate(id);
      setSuccess('Blocked date deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
      await fetchBlockedDates();
    } catch (error) {
      console.error('Error deleting blocked date:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete blocked date');
    }
  };

  const formatDate = (dateString: string): string => {
    // Parse ISO date string as local date to avoid timezone conversion issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateRange = (startDate: string, endDate: string): string => {
    // Parse ISO date strings as local dates to avoid timezone conversion issues
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);
    
    if (start.toDateString() === end.toDateString()) {
      return formatDate(startDate);
    }
    
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
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

      {/* Add New Blocked Date */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Block-Out Dates</span>
              </CardTitle>
              <CardDescription>
                Block specific dates to prevent client bookings
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Block-Out Date
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Block-Out Date</DialogTitle>
                  <DialogDescription>
                    Block specific dates to prevent client bookings during unavailable periods.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-date">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        min={formData.start_date || new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason (Optional)</Label>
                    <Textarea
                      id="reason"
                      placeholder="e.g., Vacation, Court appearance, Office closure..."
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={saving}>
                    {saving ? 'Creating...' : 'Create Block-Out Date'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Conflict Warning Dialog */}
      <Dialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span>Appointment Conflicts Detected</span>
            </DialogTitle>
            <DialogDescription>
              The following appointments conflict with your selected block-out dates:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {conflicts.map((conflict, index) => (
              <div key={index} className="p-3 border rounded-lg bg-yellow-50">
                <div className="font-medium">{conflict.title}</div>
                <div className="text-sm text-muted-foreground">
                  {formatDate(conflict.date)} at {conflict.time}
                </div>
                {conflict.attendees && (
                  <div className="text-sm text-muted-foreground">
                    Attendees: {conflict.attendees}
                  </div>
                )}
              </div>
            ))}
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              These appointments will need to be rescheduled or cancelled. Do you want to proceed with blocking these dates?
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConflictDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createBlockedDate} disabled={saving}>
              {saving ? 'Creating...' : 'Proceed Anyway'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Existing Blocked Dates */}
      <Card>
        <CardHeader>
          <CardTitle>Current Block-Out Dates</CardTitle>
          <CardDescription>
            {blockedDates.length === 0 
              ? 'No blocked dates configured' 
              : `${blockedDates.length} blocked date${blockedDates.length === 1 ? '' : 's'} configured`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {blockedDates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No block-out dates configured</p>
              <p className="text-sm">Add block-out dates to prevent client bookings during unavailable periods.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {blockedDates.map((blockedDate) => (
                <div key={blockedDate.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">
                      {formatDateRange(blockedDate.start_date, blockedDate.end_date)}
                    </div>
                    {blockedDate.reason && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {blockedDate.reason}
                      </div>
                    )}
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        Created {new Date(blockedDate.created_at).toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(blockedDate.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}