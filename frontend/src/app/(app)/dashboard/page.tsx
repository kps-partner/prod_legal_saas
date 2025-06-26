'use client';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Building2, User, Mail, CreditCard, Settings, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';

export default function DashboardPage() {
  const { user, logout, refreshUser } = useAuth();
  const searchParams = useSearchParams();
  const [calendarStatus, setCalendarStatus] = useState<{
    connected: boolean;
    calendar_name?: string;
    loading: boolean;
  }>({ connected: false, loading: true });

  // Check if user returned from successful payment and refresh user data
  useEffect(() => {
    const success = searchParams.get('success');
    if (success === 'true') {
      // Refresh user data to get updated subscription status
      refreshUser();
      
      // Clean up the URL by removing the success parameter
      const url = new URL(window.location.href);
      url.searchParams.delete('success');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, refreshUser]);

  // Fetch Google Calendar connection status
  useEffect(() => {
    const fetchCalendarStatus = async () => {
      try {
        const status = await apiClient.getGoogleCalendarStatus();
        setCalendarStatus({
          connected: status.connected,
          calendar_name: status.calendar_name,
          loading: false
        });
      } catch (error) {
        console.error('Failed to fetch calendar status:', error);
        setCalendarStatus({ connected: false, loading: false });
      }
    };

    if (user) {
      fetchCalendarStatus();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const formatSubscriptionEndDate = (timestamp: number | null | undefined) => {
    if (!timestamp) return null;
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">LawFirm OS</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700 hidden sm:inline">Welcome, {user.name}</span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">Welcome to your law firm management system</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center text-sm">
                <span className="font-medium w-16">Name:</span>
                <span className="text-gray-600">{user.name}</span>
              </div>
              <div className="flex items-center text-sm">
                <Mail className="h-4 w-4 mr-2" />
                <span className="text-gray-600">{user.email}</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="font-medium w-16">Role:</span>
                <span className="text-gray-600 capitalize">{user.role}</span>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Subscription Status
              </CardTitle>
              <CardDescription>Current billing and subscription information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  user.subscription_status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : user.subscription_status === 'canceling'
                    ? 'bg-yellow-100 text-yellow-800'
                    : user.subscription_status === 'past_due'
                    ? 'bg-yellow-100 text-yellow-800'
                    : user.subscription_status === 'incomplete'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {user.subscription_status === 'active' ? 'Active' :
                   user.subscription_status === 'canceling' ? 'Canceling' :
                   user.subscription_status === 'past_due' ? 'Past Due' :
                   user.subscription_status === 'incomplete' ? 'Incomplete' :
                   user.subscription_status === 'inactive' ? 'Inactive' :
                   user.subscription_status || 'Unknown'}
                </span>
              </div>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.location.href = '/settings/billing'}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Manage Billing
              </Button>
              {user.subscription_status === 'canceling' ? (
                <p className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                  {user.subscription_ends_at
                    ? `Subscription ends on ${formatSubscriptionEndDate(user.subscription_ends_at)}`
                    : 'Subscription canceling - Access until period end'
                  }
                </p>
              ) : user.subscription_status !== 'active' && (
                <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                  Subscribe to unlock all features
                </p>
              )}
            </CardContent>
          </Card>

          {/* Google Calendar Integration Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Google Calendar
              </CardTitle>
              <CardDescription>Connect your Google Calendar for scheduling</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                {calendarStatus.loading ? (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    Loading...
                  </span>
                ) : (
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    calendarStatus.connected
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {calendarStatus.connected ? 'Connected' : 'Not Connected'}
                  </span>
                )}
              </div>
              {calendarStatus.connected && calendarStatus.calendar_name && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Calendar:</span>
                  <span className="text-sm text-gray-600">{calendarStatus.calendar_name}</span>
                </div>
              )}
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.location.href = '/settings/integrations'}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {calendarStatus.connected ? 'Manage Calendar' : 'Connect Google Calendar'}
              </Button>
              <p className="text-xs text-gray-500">
                {calendarStatus.connected
                  ? 'Calendar connected and ready for scheduling'
                  : 'Connect your calendar to enable appointment scheduling'
                }
              </p>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" disabled>
                Add New Client
              </Button>
              <Button variant="outline" className="w-full justify-start" disabled>
                Schedule Appointment
              </Button>
              <Button variant="outline" className="w-full justify-start" disabled>
                Create Case
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Features coming in future sprints
              </p>
            </CardContent>
          </Card>

          {/* System Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Current system information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Authentication:</span>
                <span className="text-green-600 font-medium">✓ Connected</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Database:</span>
                <span className="text-green-600 font-medium">✓ Connected</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Sprint:</span>
                <span className="text-blue-600 font-medium">S3 In Progress</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Billing:</span>
                <span className="text-green-600 font-medium">✓ Stripe Ready</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Calendar:</span>
                <span className="text-yellow-600 font-medium">⚡ Google Ready</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Welcome Message */}
        <Card>
          <CardHeader>
            <CardTitle>Welcome to LawFirm OS</CardTitle>
            <CardDescription>Your comprehensive law firm management solution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p className="text-gray-600 mb-4">
                Congratulations! You have successfully completed Sprint S2 - Billing & Subscription Management.
                Your Stripe integration is fully functional with secure payment processing, subscription management, and customer portal access.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Sprint S3 Progress - Google Calendar Integration:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ Google OAuth2 authentication flow</li>
                  <li>✓ Calendar API integration backend</li>
                  <li>✓ Integrations management UI</li>
                  <li>✓ Calendar connection and selection</li>
                  <li>• Next: Appointment scheduling system</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  );
}