'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  Settings, 
  Clock,
  CalendarX
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
  const [status, setStatus] = useState<GoogleCalendarStatus | null>(null);
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [activeTab, setActiveTab] = useState('calendar');

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
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-muted-foreground mt-2">
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calendar" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Calendar Setup</span>
          </TabsTrigger>
          <TabsTrigger value="availability" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Availability</span>
          </TabsTrigger>
          <TabsTrigger value="blocked-dates" className="flex items-center space-x-2">
            <CalendarX className="h-4 w-4" />
            <span>Block-Out Dates</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          {/* Google Calendar Integration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Google Calendar</CardTitle>
                    <CardDescription>
                      Connect your Google Calendar to enable appointment scheduling
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {status?.connected ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Not Connected
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!status?.connected ? (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <p className="mb-2">To enable appointment scheduling, you need to:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Connect your Google account</li>
                      <li>Grant calendar access permissions</li>
                      <li>Select which calendar to use for appointments</li>
                    </ul>
                  </div>
                  <Button onClick={handleConnect} disabled={connecting}>
                    {connecting ? (
                      'Connecting...'
                    ) : (
                      <>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Connect Google Calendar
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="font-medium text-green-900">
                          {status.calendar_name || 'Google Calendar Connected'}
                        </div>
                        <div className="text-sm text-green-700">
                          Connected on {status.connected_at ? formatDate(status.connected_at) : 'Unknown'}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                  </div>

                  {calendars.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium">Available Calendars</h4>
                      <div className="space-y-2">
                        {calendars.map((calendar) => (
                          <div
                            key={calendar.id}
                            className={`flex items-center justify-between p-3 border rounded-lg ${
                              calendar.id === status.calendar_id
                                ? 'border-blue-200 bg-blue-50'
                                : 'border-gray-200'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{calendar.summary}</div>
                                {calendar.primary && (
                                  <Badge variant="secondary" className="text-xs">
                                    Primary
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {calendar.id === status.calendar_id ? (
                              <Badge variant="default" className="bg-blue-100 text-blue-800">
                                Selected
                              </Badge>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSelectCalendar(calendar.id, calendar.summary)}
                              >
                                Select
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability">
          {!status?.connected ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Connect Google Calendar First</h3>
                  <p className="text-muted-foreground mb-4">
                    You need to connect your Google Calendar before setting up availability.
                  </p>
                  <Button onClick={() => setActiveTab('calendar')}>
                    Go to Calendar Setup
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <AvailabilityTab />
          )}
        </TabsContent>

        <TabsContent value="blocked-dates">
          {!status?.connected ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <CalendarX className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Connect Google Calendar First</h3>
                  <p className="text-muted-foreground mb-4">
                    You need to connect your Google Calendar before managing block-out dates.
                  </p>
                  <Button onClick={() => setActiveTab('calendar')}>
                    Go to Calendar Setup
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <BlockedDatesTab />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}