'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Calendar, AlertCircle, ExternalLink } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface CalendarConnectionStatus {
  connected: boolean;
  calendar_id?: string;
  calendar_name?: string;
  connected_at?: string;
}

interface GoogleCalendar {
  id: string;
  summary: string;
  primary?: boolean;
}

export default function IntegrationsPage() {
  const [connectionStatus, setConnectionStatus] = useState<CalendarConnectionStatus>({ connected: false });
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    fetchConnectionStatus();
    
    // Check for connection success from URL params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('connected') === 'true') {
      setSuccess('Google Calendar connected successfully!');
      // Remove the parameter from URL
      window.history.replaceState({}, '', '/settings/integrations');
      // Refresh status
      setTimeout(() => {
        fetchConnectionStatus();
      }, 1000);
    } else if (urlParams.get('error') === 'auth_failed') {
      setError('Failed to connect Google Calendar. Please try again.');
      window.history.replaceState({}, '', '/settings/integrations');
    }
  }, []);

  useEffect(() => {
    if (connectionStatus.connected && calendars.length === 0) {
      fetchCalendars();
    }
  }, [connectionStatus.connected]);

  const fetchConnectionStatus = async () => {
    try {
      const status = await apiClient.getGoogleCalendarStatus();
      setConnectionStatus(status);
      if (status.calendar_id) {
        setSelectedCalendar(status.calendar_id);
      }
    } catch (error) {
      console.error('Error fetching connection status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendars = async () => {
    try {
      const data = await apiClient.getGoogleCalendars();
      setCalendars(data.calendars);
    } catch (error) {
      console.error('Error fetching calendars:', error);
      setError('Failed to fetch calendars');
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    setError('');
    
    try {
      const data = await apiClient.getGoogleAuthUrl();
      // Redirect to Google OAuth
      window.location.href = data.auth_url;
    } catch (error) {
      console.error('Error connecting to Google:', error);
      setError('Failed to connect to Google Calendar');
    } finally {
      setConnecting(false);
    }
  };

  const handleSaveCalendar = async () => {
    if (!selectedCalendar) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const selectedCalendarData = calendars.find(cal => cal.id === selectedCalendar);
      
      await apiClient.selectGoogleCalendar(
        selectedCalendar,
        selectedCalendarData?.summary || 'Unknown Calendar'
      );

      setSuccess('Calendar selected successfully!');
      fetchConnectionStatus(); // Refresh status
    } catch (error) {
      console.error('Error saving calendar:', error);
      setError('Failed to save calendar selection');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Integrations</h1>
          <div className="text-center py-8">
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Integrations</h1>
        
        {error && (
          <Alert className="mb-6" variant="destructive">
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

        <div className="grid gap-6">
          {/* Google Calendar Integration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-6 w-6 text-blue-600" />
                  <div>
                    <CardTitle>Google Calendar</CardTitle>
                    <CardDescription>
                      Connect your Google Calendar to enable client scheduling
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={connectionStatus.connected ? "default" : "secondary"}>
                  {connectionStatus.connected ? "Connected" : "Not Connected"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {!connectionStatus.connected ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Connect your Google account to allow clients to book meetings directly on your calendar.
                  </p>
                  <Button 
                    onClick={handleConnect} 
                    disabled={connecting}
                    className="flex items-center space-x-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>{connecting ? 'Connecting...' : 'Connect Google Account'}</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Google Calendar connected successfully</span>
                  </div>
                  
                  {connectionStatus.connected_at && (
                    <p className="text-sm text-muted-foreground">
                      Connected on {new Date(connectionStatus.connected_at).toLocaleDateString()}
                    </p>
                  )}

                  {calendars.length > 0 && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">Select Calendar for Bookings</label>
                        <p className="text-xs text-muted-foreground mb-2">
                          Choose which calendar should be used for client appointments
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Select value={selectedCalendar} onValueChange={setSelectedCalendar}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select a calendar" />
                          </SelectTrigger>
                          <SelectContent>
                            {calendars.map((calendar) => (
                              <SelectItem key={calendar.id} value={calendar.id}>
                                <div className="flex items-center space-x-2">
                                  <span>{calendar.summary}</span>
                                  {calendar.primary && (
                                    <Badge variant="outline" className="text-xs">Primary</Badge>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Button 
                          onClick={handleSaveCalendar}
                          disabled={!selectedCalendar || saving}
                          size="sm"
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </Button>
                      </div>

                      {connectionStatus.calendar_name && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm">
                            <strong>Current calendar:</strong> {connectionStatus.calendar_name}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Future integrations can be added here */}
          <Card className="opacity-50">
            <CardHeader>
              <CardTitle className="text-muted-foreground">More Integrations Coming Soon</CardTitle>
              <CardDescription>
                We're working on additional integrations to enhance your workflow.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}