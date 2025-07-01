'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Settings,
  Clock,
  CalendarX,
  ArrowLeft
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { AvailabilityTab } from '@/components/calendar/AvailabilityTab';
import { BlockedDatesTab } from '@/components/calendar/BlockedDatesTab';

interface GoogleCalendarStatus {
  connected: boolean;
  calendar_id?: string;
  calendar_name?: string;
  connected_at?: string;
  has_gmail_permissions?: boolean;
  required_scopes?: string[];
  needs_reauth?: boolean;
}

interface GoogleCalendar {
  id: string;
  summary: string;
  primary?: boolean;
}

export default function IntegrationsPage() {
  const router = useRouter();
  const [status, setStatus] = useState<GoogleCalendarStatus | null>(null);
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const statusData = await apiClient.getGoogleCalendarStatus();
      setStatus(statusData);
      
      if (statusData.connected) {
        const calendarsData = await apiClient.getGoogleCalendars();
        setCalendars(calendarsData.calendars);
      }
    } catch (error) {
      console.error('Error fetching status:', error);
      setError('Failed to load integration status');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setConnecting(true);
      setError('');
      
      const { auth_url } = await apiClient.getGoogleAuthUrl();
      window.location.href = auth_url;
    } catch (error) {
      console.error('Error connecting to Google:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect to Google Calendar');
      setConnecting(false);
    }
  };

  const handleSelectCalendar = async (calendarId: string, calendarName: string) => {
    try {
      setError('');
      setSuccess('');
      
      await apiClient.selectGoogleCalendar(calendarId, calendarName);
      setSuccess('Calendar selected successfully!');
      setTimeout(() => setSuccess(''), 3000);
      
      await fetchStatus();
    } catch (error) {
      console.error('Error selecting calendar:', error);
      setError(error instanceof Error ? error.message : 'Failed to select calendar');
    }
  };

  const formatDate = (timestamp: string): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4">
      <div className="mb-4">
        <div className="flex items-center space-x-4 mb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Button>
        </div>
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-muted-foreground text-sm">
          Connect and manage your external service integrations
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {/* Google Calendar Integration Section - Full Width */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-blue-100 rounded-md">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Google Calendar Setup</CardTitle>
                  <CardDescription className="text-xs">
                    Connect your Google Calendar to enable appointment scheduling
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {status?.connected ? (
                  <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Not Connected
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {!status?.connected ? (
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground">
                  <p className="mb-1">To enable appointment scheduling:</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-2 text-xs">
                    <li>Connect your Google account</li>
                    <li>Grant calendar access permissions</li>
                    <li>Select which calendar to use for appointments</li>
                  </ul>
                </div>
                <Button onClick={handleConnect} disabled={connecting} size="sm">
                  {connecting ? (
                    'Connecting...'
                  ) : (
                    <>
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Connect Google Calendar
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-md border border-green-200">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="font-medium text-green-900 text-sm">
                      {status.calendar_name || 'Google Calendar Connected'}
                    </div>
                    <div className="text-xs text-green-700">
                      Connected on {status.connected_at ? formatDate(status.connected_at) : 'Unknown'}
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="text-xs">
                  <Settings className="h-3 w-3 mr-1" />
                  Manage
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Two Column Layout for Availability and Block-Out Dates */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Availability Section */}
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-green-100 rounded-md">
                  <Clock className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Availability Settings</CardTitle>
                  <CardDescription className="text-xs">
                    Configure your business hours and availability
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {!status?.connected ? (
                <div className="text-center py-4">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <h3 className="text-sm font-medium mb-1">Connect Google Calendar First</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    You need to connect your Google Calendar before setting up availability.
                  </p>
                  <Button size="sm" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    Go to Calendar Setup
                  </Button>
                </div>
              ) : (
                <AvailabilityTab />
              )}
            </CardContent>
          </Card>

          {/* Block-Out Dates Section */}
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-red-100 rounded-md">
                  <CalendarX className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Block-Out Dates</CardTitle>
                  <CardDescription className="text-xs">
                    Block specific dates to prevent client bookings
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {!status?.connected ? (
                <div className="text-center py-4">
                  <CalendarX className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <h3 className="text-sm font-medium mb-1">Connect Google Calendar First</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    You need to connect your Google Calendar before managing block-out dates.
                  </p>
                  <Button size="sm" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    Go to Calendar Setup
                  </Button>
                </div>
              ) : (
                <BlockedDatesTab />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}